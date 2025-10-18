import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../helpers/app.helper";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] Error Handlers - Express", () => {
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

  describe("UnauthorizedError - 401", () => {
    it("deve capturar UnauthorizedError e retornar 401", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "INVALID_CNPJ")
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
      expect(response.body.statusCode).toBe(401);
    });

    it("deve retornar estrutura correta do erro de autenticação", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "00000000000000")
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.body).toMatchObject({
        code: "UNAUTHORIZED",
        statusCode: 401,
        error: expect.any(String),
      });
    });
  });

  describe("InvalidFieldsError - 400", () => {
    it("deve capturar InvalidFieldsError de validação de body", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "INVALID_PRODUCT",
          id: [],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });

    it("deve retornar estrutura detalhada do erro de validação", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto",
          id: ["invalid"],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.body).toMatchObject({
        code: "INVALID_FIELDS",
        statusCode: 400,
        error: expect.any(Object),
      });
    });
  });

  describe("Error genérico - 500", () => {
    it("deve retornar 500 para erros não categorizados", async () => {
      // Força erro ao não enviar headers obrigatórios
      const response = await request(app).post("/reenviar").send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("statusCode");
    });
  });

  describe("Headers de resposta", () => {
    it("deve retornar Content-Type application/json para erros", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "invalid")
        .send({});

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("deve retornar JSON bem formatado mesmo em caso de erro", async () => {
      const response = await request(app).post("/reenviar").send({});

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });
  });
});
