import { App } from "@/app";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { Express } from "express";
import request from "supertest";

import { TestDataHelper } from "../../../integration/helpers/test-data.helper";

describe("Webhook /reenviar - E2E", () => {
  let app: Express;

  beforeAll(async () => {
    await TestDataHelper.initialize();
    app = new App().server;
  });

  beforeEach(async () => {
    await TestDataHelper.cleanup();
  });

  afterAll(async () => {
    await TestDataHelper.cleanup();
    await TestDataHelper.shutdown();
  });

  const buildHeaders = (
    scenario: Awaited<ReturnType<typeof TestDataHelper.createTestScenario>>,
  ) => ({
    "x-api-cnpj-sh": scenario.softwareHouse.cnpj,
    "x-api-token-sh": scenario.softwareHouse.token,
    "x-api-cnpj-cedente": scenario.cedente.cnpj,
    "x-api-token-cedente": scenario.cedente.token,
  });

  const enableWebhookConfiguration = async (conta: any) => {
    await conta.update({
      configuracao_notificacao: {
        url: "https://webhook.site/e2e",
        email: null,
        tipos: {},
        cancelado: true,
        pago: true,
        disponivel: true,
        header: true,
        header_campo: "Authorization",
        header_valor: "Bearer e2e-token",
        headers_adicionais: [{ "X-Custom": "E2E" }],
        ativado: true,
      },
    });
  };

  it("deve retornar 200 e protocolo para primeira requisição", async () => {
    const scenario = await TestDataHelper.createTestScenario();
    await enableWebhookConfiguration(scenario.conta);

    const headers = buildHeaders(scenario);
    const payload = {
      product: "boleto",
      id: [scenario.servico.id.toString()],
      kind: "webhook",
      type: "disponivel",
    };

    const response = await request(app)
      .post("/reenviar")
      .set(headers)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "Notificação reenviada com sucesso",
      protocolo: expect.any(String),
    });
  });

  it("deve persistir protocolo no banco para primeira requisição", async () => {
    const scenario = await TestDataHelper.createTestScenario();
    await enableWebhookConfiguration(scenario.conta);

    const headers = buildHeaders(scenario);
    const payload = {
      product: "boleto",
      id: [scenario.servico.id.toString()],
      kind: "webhook",
      type: "disponivel",
    };

    const response = await request(app)
      .post("/reenviar")
      .set(headers)
      .send(payload);

    const storedRecords = await WebhookReprocessado.findAll();
    expect(storedRecords).toHaveLength(1);
    const storedRecord = storedRecords[0];
    expect(storedRecord.protocolo).toEqual(response.body.protocolo);
    expect(storedRecord.product).toBe("BOLETO");
    expect(storedRecord.kind).toBe("webhook");
    expect(storedRecord.type).toBe("disponivel");
    expect(storedRecord.servico_id).toEqual([scenario.servico.id.toString()]);
  });

  it("deve gravar flag '1' no cache após primeira requisição", async () => {
    const scenario = await TestDataHelper.createTestScenario();
    await enableWebhookConfiguration(scenario.conta);

    const headers = buildHeaders(scenario);
    const payload = {
      product: "boleto",
      id: [scenario.servico.id.toString()],
      kind: "webhook",
      type: "disponivel",
    };

    await request(app).post("/reenviar").set(headers).send(payload);

    const cacheKey = `reenviar:BOLETO:${scenario.servico.id}:disponivel`;
    const cacheValue = await CacheService.getInstance().get(cacheKey);
    expect(cacheValue).not.toBeNull();
    expect(cacheValue).toBe("1");
  });

  it("deve retornar 409 em requisição duplicada e não persistir novo registro", async () => {
    const scenario = await TestDataHelper.createTestScenario();
    await enableWebhookConfiguration(scenario.conta);

    const headers = buildHeaders(scenario);
    const payload = {
      product: "boleto",
      id: [scenario.servico.id.toString()],
      kind: "webhook",
      type: "disponivel",
    };

    const first = await request(app)
      .post("/reenviar")
      .set(headers)
      .send(payload);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/reenviar")
      .set(headers)
      .send(payload);

    expect(second.status).toBe(409);
    expect(second.body.code).toBe("ALREADY_PROCESSED");

    const recordsAfterCache = await WebhookReprocessado.findAll();
    expect(recordsAfterCache).toHaveLength(1);
  });
});
