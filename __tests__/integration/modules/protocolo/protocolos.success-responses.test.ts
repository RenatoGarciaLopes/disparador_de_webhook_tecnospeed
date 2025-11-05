import { App } from "@/app";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

describe("[PROTOCOL] /protocolos - Success Responses", () => {
  let app: Express;
  let testData: any;

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

  const validHeaders = () => ({
    "x-api-cnpj-sh": testData.softwareHouse.cnpj,
    "x-api-token-sh": testData.softwareHouse.token,
    "x-api-cnpj-cedente": testData.cedente.cnpj,
    "x-api-token-cedente": testData.cedente.token,
  });

  it("retorna 200 e lista protocolos no intervalo informado", async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
      protocolo: "123e4567-e89b-12d3-a456-426614174000",
      product: "BOLETO",
      kind: "webhook",
      type: "pago",
      servico_id: ["1"],
      data: { notifications: [] },
      data_criacao: now,
    });

    const res = await request(app)
      .get("/protocolos")
      .set(validHeaders())
      .query({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty("protocolo");
  });

  it("aplica filtros de product, type, kind e id", async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
      protocolo: "123e4567-e89b-12d3-a456-426614174001",
      product: "BOLETO",
      kind: "webhook",
      type: "pago",
      servico_id: ["10"],
      data: { notifications: [] },
      data_criacao: now,
    });
    await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
      protocolo: "123e4567-e89b-12d3-a456-426614174002",
      product: "PIX",
      kind: "webhook",
      type: "disponivel",
      servico_id: ["20"],
      data: { notifications: [] },
      data_criacao: now,
    });

    const res = await request(app)
      .get("/protocolos")
      .set(validHeaders())
      .query({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        product: "boleto",
        type: "pago",
        kind: "webhook",
        id: [],
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].product).toBe("BOLETO");
    expect(res.body.data[0].type).toBe("pago");
    expect(res.body.data[0].servico_id).toContain("10");
  });

  describe("Paginação", () => {
    it("retorna paginação padrão (page=1, limit=10) quando não especificado", async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Criar 15 protocolos para testar paginação
      for (let i = 0; i < 15; i++) {
        await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
          protocolo: `123e4567-e89b-12d3-a456-42661417400${i}`,
          product: "BOLETO",
          kind: "webhook",
          type: "pago",
          servico_id: [`${i + 1}`],
          data: { notifications: [] },
          data_criacao: now,
        });
      }

      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBe(15);
      expect(res.body.pagination.total_pages).toBe(2);
      expect(res.body.data.length).toBe(10);
    });

    it("aplica paginação customizada com page e limit", async () => {
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Criar 25 protocolos
      for (let i = 0; i < 25; i++) {
        await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
          protocolo: `123e4567-e89b-12d3-a456-42661417400${i}`,
          product: "BOLETO",
          kind: "webhook",
          type: "pago",
          servico_id: [`${i + 1}`],
          data: { notifications: [] },
          data_criacao: now,
        });
      }

      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          page: "2",
          limit: "10",
        });

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBe(25);
      expect(res.body.pagination.total_pages).toBe(3);
      expect(res.body.data.length).toBe(10);
    });
  });
});
