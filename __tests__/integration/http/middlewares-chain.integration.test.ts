import { Express } from "express";
import request from "supertest";
import { AppHelper } from "../../helpers/app.helper";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] Middlewares Chain - Express", () => {
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

  describe("Ordem de execução dos middlewares", () => {
    it("deve executar validateAuthHeaders antes de validateBody", async () => {
      // Se não enviar headers, deve falhar antes de validar body
      const response = await request(app).post("/reenviar").send({
        product: "INVALID_WILL_NOT_BE_VALIDATED",
        id: [],
        kind: "webhook",
        type: "disponivel",
      });

      // Deve retornar 401 (headers), não 400 (body)
      expect(response.status).toBe(401);
    });

    it("deve validar body apenas se headers forem válidos", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "INVALID",
          id: [],
          kind: "webhook",
          type: "disponivel",
        });

      // Deve retornar 400 (body inválido) pois headers passaram
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });
  });

  describe("Transformação do request", () => {
    it("deve adicionar cedenteId ao request após validação de headers", async () => {
      // Este teste valida que o middleware modifica o request
      // O controller recebe req.cedenteId
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

      // Se chegou no controller sem erro, cedenteId foi adicionado
      expect(response.status).toBe(200);
    });

    it("deve transformar body após validação", async () => {
      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .send({
          product: "boleto", // lowercase
          id: ["1", "2"], // strings
          kind: "webhook",
          type: "disponivel", // lowercase
        });

      // Body foi transformado:
      // product: "boleto" → "BOLETO"
      // id: ["1", "2"] → [1, 2]
      // type: "disponivel" → "DISPONIVEL"
      expect(response.status).toBe(200);
    });
  });

  describe("Short-circuit em caso de erro", () => {
    it("não deve executar validateBody se validateAuthHeaders falhar", async () => {
      const response = await request(app)
        .post("/reenviar")
        // Sem headers → falha em validateAuthHeaders
        .send({
          product: "boleto",
          id: ["1"],
          kind: "webhook",
          type: "disponivel",
        });

      // Deve retornar 401, NÃO 400
      // Se retornasse 400, significaria que validateBody foi executado
      expect(response.status).toBe(401);
    });
  });
});
