import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../helpers/app.helper";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] POST /reenviar - Endpoint", () => {
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

  describe("Requisição válida completa", () => {
    it("deve processar requisição HTTP → Middlewares → DB → Response", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["1", "2"],
          kind: "webhook",
          type: "disponivel",
        });

      // Valida resposta HTTP
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);

      // Valida estrutura da resposta
      expect(response.body).toMatchObject({
        message: expect.any(String),
        protocolos: expect.any(Array),
        total: expect.any(Number),
        timestamp: expect.any(String),
        product: expect.any(String),
      });
    });

    it("deve validar headers no banco de dados real", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Se chegou aqui, as queries no banco funcionaram
      expect(response.status).toBe(200);
    });
  });

  describe("Validação de autenticação (query real no banco)", () => {
    it("deve retornar 401 se Software House não existir no banco", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "00000000000000") // Não existe
        .set("x-api-token-sh", "invalid")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("deve retornar 401 se Cedente não existir no banco", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "00000000000000") // Não existe
        .set("x-api-token-cedente", "invalid")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("deve retornar 401 se token da Software House for inválido", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "wrong-token") // Token errado
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Validação de body", () => {
    it("deve retornar 400 para product inválido", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "INVALID",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve retornar 400 para array de IDs vazio", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: [],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Validação de serviços (query real no banco)", () => {
    it("deve retornar 400 se IDs não existirem no banco", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["999", "888"], // IDs não existem
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
      expect(response.body.error.properties.id).toBeDefined();
    });
  });

  describe("Error handling completo", () => {
    it("deve retornar estrutura correta para erro 401", async () => {
      const response = await request(app).post("/reenviar").send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("statusCode");
      expect(response.body).toHaveProperty("error");
    });
  });
});
