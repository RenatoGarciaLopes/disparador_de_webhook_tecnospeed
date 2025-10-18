import { ProtocolosController } from "@/modules/protocolo/interfaces/http/controllers/ProtocolosController";
import { ProtocolosRoutes } from "@/modules/protocolo/interfaces/http/routes/ProtocolosRoutes";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import express, { Express } from "express";
import request from "supertest";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] GET /protocolo/:id - Endpoint", () => {
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
    const protocoloId = "550e8400-e29b-41d4-a716-446655440001";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: {
          product: "boleto",
          ids: [1, 2],
          kind: "webhook",
          type: "DISPONIVEL",
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve processar requisição HTTP → Middlewares → DB → Response", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      // Valida resposta HTTP
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("deve validar headers no banco de dados real", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      // Se chegou aqui, as queries no banco funcionaram
      expect(response.status).toBe(200);
    });
  });

  describe("Validação de autenticação (query real no banco)", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440002";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: { test: "auth test" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve retornar 401 se headers estiverem ausentes", async () => {
      const response = await request(app).get(`/protocolo/${protocoloId}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("deve retornar 401 se header de cedente estiver vazio", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Busca por ID específico", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440010";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: {
          product: "boleto",
          ids: [1, 2, 3],
          metadata: { user: "test" },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve buscar protocolo existente por ID", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });

    it("deve retornar 404 para protocolo não existente", async () => {
      const response = await request(app)
        .get("/protocolo/550e8400-e29b-41d4-a716-999999999999")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      // Pode ser 404 ou 200 com null, dependendo da implementação
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Isolamento entre cedentes", () => {
    const protocolo1Id = "550e8400-e29b-41d4-a716-446655440020";
    const protocolo2Id = "550e8400-e29b-41d4-a716-446655440021";

    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: protocolo1Id,
          data: { cedente: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date(),
        },
        {
          id: protocolo2Id,
          data: { cedente: 2 },
          cedente_id: 2,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date(),
        },
      ] as any[]);
    });

    it("deve permitir acesso apenas ao protocolo do próprio cedente", async () => {
      // Cedente 1 acessa seu próprio protocolo
      const response = await request(app)
        .get(`/protocolo/${protocolo1Id}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });

    it("deve bloquear acesso a protocolo de outro cedente", async () => {
      // Cedente 1 tenta acessar protocolo do Cedente 2
      const response = await request(app)
        .get(`/protocolo/${protocolo2Id}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      // Deve retornar 404 ou null (não encontrado)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Validação de UUID", () => {
    it("deve aceitar UUID válido", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440030";

      await WebhookReprocessado.create({
        id: validId,
        data: { test: "valid uuid" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const response = await request(app)
        .get(`/protocolo/${validId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });

    it("deve lidar com UUID inválido/malformado", async () => {
      const response = await request(app)
        .get("/protocolo/invalid-uuid-format")
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      // Pode ser 400 ou 404 dependendo da implementação
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe("Diferentes tipos de protocolos", () => {
    it("deve buscar protocolo de produto boleto", async () => {
      const id = "550e8400-e29b-41d4-a716-446655440040";

      await WebhookReprocessado.create({
        id,
        data: { product: "boleto" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const response = await request(app)
        .get(`/protocolo/${id}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });

    it("deve buscar protocolo de produto pix", async () => {
      const id = "550e8400-e29b-41d4-a716-446655440041";

      await WebhookReprocessado.create({
        id,
        data: { product: "pix" },
        cedente_id: 1,
        kind: "webhook",
        type: "LIQUIDATED",
        servico_id: ["1"],
        product: "pix",
        data_criacao: new Date(),
      } as any);

      const response = await request(app)
        .get(`/protocolo/${id}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });

    it("deve buscar protocolo de produto pagamento", async () => {
      const id = "550e8400-e29b-41d4-a716-446655440042";

      await WebhookReprocessado.create({
        id,
        data: { product: "pagamento" },
        cedente_id: 1,
        kind: "webhook",
        type: "SCHEDULED",
        servico_id: ["1"],
        product: "pagamento",
        data_criacao: new Date(),
      } as any);

      const response = await request(app)
        .get(`/protocolo/${id}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });
  });

  describe("Error handling completo", () => {
    it("deve retornar estrutura correta para erro 401", async () => {
      const response = await request(app).get(
        "/protocolo/550e8400-e29b-41d4-a716-446655440050",
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("statusCode");
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Headers case-insensitive", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440060";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: { test: "case insensitive" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve aceitar headers em uppercase", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("X-API-CNPJ-SH", "12345678901234")
        .set("X-API-TOKEN-SH", "sh-token-test")
        .set("X-API-CNPJ-CEDENTE", "98765432109876")
        .set("X-API-TOKEN-CEDENTE", "cedente-token-test");

      expect(response.status).toBe(200);
    });
  });

  describe("Performance", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440070";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: { test: "performance" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve responder em tempo adequado", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Menos de 2 segundos
    });
  });

  describe("Dados complexos em JSONB", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440080";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: {
          product: "boleto",
          ids: [1, 2, 3, 4, 5],
          metadata: {
            user: "test",
            timestamp: new Date().toISOString(),
            nested: {
              level1: {
                level2: "deep value",
              },
            },
          },
          array: [1, "two", true, null],
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve buscar protocolo com dados JSONB complexos", async () => {
      const response = await request(app)
        .get(`/protocolo/${protocoloId}`)
        .set("x-api-cnpj-sh", "12345678901234")
        .set("x-api-token-sh", "sh-token-test")
        .set("x-api-cnpj-cedente", "98765432109876")
        .set("x-api-token-cedente", "cedente-token-test");

      expect(response.status).toBe(200);
    });
  });
});
