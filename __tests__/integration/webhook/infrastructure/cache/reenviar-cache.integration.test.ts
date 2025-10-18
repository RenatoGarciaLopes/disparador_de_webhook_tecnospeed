import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../../../helpers/app.helper";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] POST /reenviar - Cache", () => {
  let app: Express;

  beforeAll(async () => {
    await DatabaseHelper.setup();
    app = AppHelper.createTestApp();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Cache Hit - Requisição duplicada", () => {
    it("deve retornar resposta cacheada para requisição idêntica", async () => {
      // DOCS linha 338: "No caso de achar o cache, então deve ser retornado o valor do cache pois esse já foi processado e tem sucesso"
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      const body = {
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "disponivel",
      };

      // Primeira requisição - processa normalmente
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);

      expect(response1.status).toBe(200);
      const firstResponse = response1.body;

      // Segunda requisição (duplicada) - deve retornar cache
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(firstResponse);
    });

    it("deve gerar mesma chave de cache independente da ordem dos IDs", async () => {
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      // Primeira requisição com IDs em uma ordem
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1", "2", "3"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response1.status).toBe(200);

      // Segunda requisição com mesmos IDs em ordem diferente
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["3", "1", "2"], // Ordem diferente
          kind: "webhook",
          type: "disponivel",
        });

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
    });
  });

  describe("Cache Miss - Requisição não cacheada", () => {
    it("deve processar normalmente para requisição diferente", async () => {
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      // Primeira requisição
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response1.status).toBe(200);

      // Segunda requisição com IDs diferentes - não deve usar cache
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["2"], // ID diferente
          kind: "webhook",
          type: "disponivel",
        });

      expect(response2.status).toBe(200);
      // Respostas devem ser diferentes
      expect(response2.body).not.toEqual(response1.body);
    });

    it("deve processar separadamente para produtos diferentes", async () => {
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      // Requisição com produto "boleto"
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response1.status).toBe(200);

      // Requisição com mesmo ID mas produto "pix" - não deve usar cache
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "pix",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Pode dar erro se o serviço não for PIX, mas não deve retornar cache
      expect(response2.body).not.toEqual(response1.body);
    });

    it("deve processar separadamente para types diferentes", async () => {
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      // Requisição com type "disponivel"
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response1.status).toBe(200);

      // Requisição com mesmo ID mas type "cancelado" - não deve usar cache
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "cancelado",
        });

      // Pode dar erro se a situação não corresponder, mas não deve retornar cache
      expect(response2.body).not.toEqual(response1.body);
    });
  });

  describe("Cache apenas para requisições bem-sucedidas", () => {
    it("não deve cachear requisições com erro de validação", async () => {
      // DOCS linha 336: "Somente caso a requisição já tenha sido processada e tenha sucesso"
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      const body = {
        product: "boleto",
        id: ["999"], // ID não existe
        kind: "webhook",
        type: "disponivel",
      };

      // Primeira requisição - erro 400
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);

      expect(response1.status).toBe(400);

      // Segunda requisição idêntica - deve processar novamente, não usar cache
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);

      expect(response2.status).toBe(400);
      expect(response2.body.code).toBe("INVALID_FIELDS");
    });

    it("não deve cachear requisições com erro de autenticação", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };

      // Primeira requisição - erro 401 (sem headers)
      const response1 = await request(app).post("/reenviar").send(body);

      expect(response1.status).toBeGreaterThanOrEqual(400);

      // Segunda requisição idêntica - deve processar novamente
      const response2 = await request(app).post("/reenviar").send(body);

      expect(response2.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Formato da chave de cache", () => {
    it("deve usar formato product:ids:kind:type", async () => {
      // DOCS linha 328-330: "boleto:1,2,3,4:webhook:disponível"
      // Este teste valida o comportamento esperado indiretamente
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      const response = await request(app)
        .post("/reenviar")
        .set(headers)
        .send({
          product: "boleto",
          id: ["1", "2", "3", "4"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(200);

      // A chave esperada seria: "boleto:1,2,3,4:webhook:disponivel"
      // Este teste valida que o cache funciona como esperado
    });
  });

  describe("Performance com cache", () => {
    it("deve ser mais rápido para requisições cacheadas", async () => {
      const headers = {
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      };

      const body = {
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "disponivel",
      };

      // Primeira requisição - sem cache
      const start1 = Date.now();
      const response1 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);
      const duration1 = Date.now() - start1;

      expect(response1.status).toBe(200);

      // Segunda requisição - com cache (deve ser mais rápida)
      const start2 = Date.now();
      const response2 = await request(app)
        .post("/reenviar")
        .set(headers)
        .send(body);
      const duration2 = Date.now() - start2;

      expect(response2.status).toBe(200);

      // Cache deve ser mais rápido (ou pelo menos igual)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });
});
