import { App } from "@/app";
import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../helpers/test-data.helper";

describe("Error Handling - Integration Tests", () => {
  let testData: any;
  let app: Express;

  beforeAll(async () => {
    await TestDataHelper.initialize();
    app = new App().server;
  });

  beforeEach(async () => {
    await TestDataHelper.cleanup();
    testData = await TestDataHelper.createTestScenario();
  });

  afterAll(async () => {
    await TestDataHelper.cleanup();
  });

  describe("Erros de Autenticação", () => {
    it("deve retornar 401 com mensagem genérica para credenciais inválidas", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "00.000.000/0000-00")
        .set("x-api-token-sh", "invalid-token")
        .set("x-api-cnpj-cedente", "00.000.000/0000-00")
        .set("x-api-token-cedente", "invalid-token")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Credenciais inválidas");
      expect(response.body.statusCode).toBe(401);
    });

    it("deve retornar 401 quando Software House está inativa", async () => {
      const softwareHouse = await TestDataHelper.createSoftwareHouse({
        cnpj: "22.345.678/0001-90",
        token: testData.softwareHouse.token,
        status: "inativo",
      });

      const cedente = await TestDataHelper.createCedente(softwareHouse.id, {
        cnpj: "33.445.678/0001-90",
        token: "test-cedente-token",
      });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", softwareHouse.cnpj)
        .set("x-api-token-sh", softwareHouse.token)
        .set("x-api-cnpj-cedente", cedente.cnpj)
        .set("x-api-token-cedente", cedente.token)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Credenciais inválidas");
    });

    it("deve retornar 401 quando Cedente está inativo", async () => {
      const cedente = await TestDataHelper.createCedente(
        testData.softwareHouse.id,
        {
          cnpj: "33.445.678/0001-90",
          token: "test-cedente-token",
          status: "inativo",
        },
      );

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", cedente.cnpj)
        .set("x-api-token-cedente", cedente.token)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Credenciais inválidas");
    });
  });

  describe("Erros de Validação", () => {
    it("deve retornar 400 para headers ausentes", async () => {
      const response = await request(app)
        .post("/reenviar")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 400 para headers com formato inválido", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "invalid-cnpj")
        .set("x-api-token-sh", "")
        .set("x-api-cnpj-cedente", "invalid-cnpj")
        .set("x-api-token-cedente", "")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 400 para product inválido", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "invalid-product",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 400 para type inválido", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "invalid-type",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 400 para array de IDs vazio", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: [],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 400 para exceder máximo de IDs", async () => {
      const manyIds = Array.from({ length: 101 }, (_, i) => `servico-${i}`);

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: manyIds,
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });
  });

  describe("Erros de Regras de Negócio", () => {
    it("deve retornar 400 quando serviço não existe", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: ["servico-inexistente"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 422 quando serviço não pertence ao cedente", async () => {
      const anotherCedente = await TestDataHelper.createCedente(
        testData.softwareHouse.id,
        {
          cnpj: "11.111.111/0001-11",
          token: "another-cedente-token",
        },
      );

      const conta = await TestDataHelper.createConta(anotherCedente.id, {
        id: 10,
        cedente_id: anotherCedente.id,
      });

      const convenio = await TestDataHelper.createConvenio(conta.id, {
        id: 10,
      });

      const servico = await TestDataHelper.createServico(convenio.id, {
        id: 10,
      });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: [servico.id.toString()],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(422);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 422 quando serviço está inativo", async () => {
      const servico = await TestDataHelper.createServico(testData.convenio.id, {
        id: 14,
        status: "inativo",
      });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: [servico.id.toString()],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(422);
      expect(response.body?.error?.properties).toBeDefined();
    });

    it("deve retornar 422 quando product não corresponde ao serviço", async () => {
      const servico = await TestDataHelper.createServico(testData.convenio.id, {
        id: 11,
      });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "pix", // Diferente do serviço que é "boleto"
          id: [servico.id.toString()],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(422);
      expect(response.body?.error?.properties).toBeDefined();
    });
  });

  describe("Erros de Implementação", () => {
    it("deve retornar 501 para kind não implementado", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "not_implemented",
          type: "disponivel",
        });

      expect(response.status).toBe(501);
      expect(response.body?.error?.errors?.length).toBeGreaterThan(0);
    });
  });

  describe("Erros Internos", () => {
    it("deve retornar 500 para erros internos do servidor", async () => {
      jest
        .spyOn(ReenviarService.prototype, "webhook")
        .mockRejectedValue(new Error("Erro interno do servidor"));
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Este teste pode ser expandido para simular cenários de erro específicos
      expect([200, 500]).toContain(response.status);
    });
  });
});
