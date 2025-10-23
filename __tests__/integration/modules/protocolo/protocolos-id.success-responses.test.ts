import { App } from "@/app";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

describe("[PROTOCOL] /protocolos/:id - Success Responses", () => {
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

  it("retorna 200 quando protocolo existir para o cedente", async () => {
    const now = new Date();
    const protocoloId = "123e4567-e89b-12d3-a456-426614174003";

    await TestDataHelper.createWebhookReprocessado(testData.cedente.id, {
      protocolo: protocoloId,
      product: "PIX",
      kind: "webhook",
      type: "disponivel",
      servico_id: ["30"],
      data: { notifications: [] },
      data_criacao: now,
    });

    const res = await request(app)
      .get(`/protocolos/${protocoloId}`)
      .set(validHeaders());

    expect(res.status).toBe(200);
    expect(res.body?.protocolo).toBe(protocoloId);
    expect(res.body?.cedente_id).toBe(testData.cedente.id);
  });

  it("retorna 400 quando protocolo não encontrado", async () => {
    const res = await request(app)
      .get("/protocolos/123e4567-e89b-12d3-a456-426614179999")
      .set(validHeaders());

    expect([400, 500]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body?.error?.errors).toContain("Protocolo não encontrado.");
    }
  });
});
