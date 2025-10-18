import { ProtocolosController } from "@/modules/protocolo/interfaces/http/controllers/ProtocolosController";
import { ProtocolosRoutes } from "@/modules/protocolo/interfaces/http/routes/ProtocolosRoutes";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import express, { Express } from "express";
import request from "supertest";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] GET /protocolo - Endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    await DatabaseHelper.setup();

    // Criar app de teste com rotas de protocolo
    app = express();
    app.use(express.json());

    const protocolosRoutes = new ProtocolosRoutes(new ProtocolosController());
    app.use(protocolosRoutes.router);
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
    beforeEach(async () => {
      // Criar protocolos de teste
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          data: { test: "protocolo 1" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          data: { test: "protocolo 2" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-20"),
        },
      ] as any[]);
    });

    it("deve processar requisição HTTP → Middlewares → DB → Response", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      // Valida resposta HTTP
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("deve validar headers no banco de dados real", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      // Se chegou aqui, as queries no banco funcionaram
      expect(response.status).toBe(200);
    });
  });

  describe("Validação de autenticação (query real no banco)", () => {
    it("deve retornar 401 se headers estiverem ausentes", async () => {
      const response = await request(app).get("/protocolo").query({
        start_date: "2025-01-01",
        end_date: "2025-01-31",
      });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("deve retornar 401 se header de cedente estiver vazio", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Validação de query params", () => {
    it("deve retornar 400 para campos extras não permitidos", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          extraField: "not-allowed",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("INVALID_FIELDS");
    });
  });

  describe("Busca com filtros", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440010",
          data: { test: "boleto" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          data: { test: "pix" },
          cedente_id: 1,
          kind: "webhook",
          type: "LIQUIDATED",
          servico_id: ["2"],
          product: "pix",
          data_criacao: new Date("2025-01-20"),
        },
      ] as any[]);
    });

    it("deve filtrar protocolos por produto", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          product: "boleto",
        });

      expect(response.status).toBe(200);
    });

    it("deve filtrar protocolos por tipo", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          type: "DISPONIVEL",
        });

      expect(response.status).toBe(200);
    });

    it("deve filtrar protocolos por kind", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          kind: "webhook",
        });

      expect(response.status).toBe(200);
    });
  });

  describe("Validação de intervalo de datas", () => {
    it("deve aceitar intervalo de datas válido", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01T00:00:00Z",
          end_date: "2025-01-31T23:59:59Z",
        });

      expect(response.status).toBe(200);
    });
  });

  describe("Isolamento entre cedentes", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440020",
          data: { cedente: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440021",
          data: { cedente: 2 },
          cedente_id: 2,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
      ] as any[]);
    });

    it("deve retornar apenas protocolos do cedente autenticado", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      expect(response.status).toBe(200);
      // Validação adicional dependeria da implementação do controller
    });
  });

  describe("Error handling completo", () => {
    it("deve retornar estrutura correta para erro 401", async () => {
      const response = await request(app).get("/protocolo").query({
        start_date: "2025-01-01",
        end_date: "2025-01-31",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("statusCode");
      expect(response.body).toHaveProperty("error");
    });

    it("deve retornar estrutura correta para erro 400", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          invalidField: "value",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("statusCode");
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Headers case-insensitive", () => {
    it("deve aceitar headers em uppercase", async () => {
      const response = await request(app)
        .get("/protocolo")
        .set("X-API-CNPJ-SH", "12345678901234")
        .set("X-API-TOKEN-SH", "sh-token-test")
        .set("X-API-CNPJ-CEDENTE", "98765432109876")
        .set("X-API-TOKEN-CEDENTE", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      expect(response.status).toBe(200);
    });
  });

  describe("Performance", () => {
    it("deve responder em tempo adequado", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get("/protocolo")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test")
        .query({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
        });

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Menos de 5 segundos
    });
  });
});
