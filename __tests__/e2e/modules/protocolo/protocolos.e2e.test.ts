import { App } from "@/app";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { Express } from "express";
import { randomUUID } from "node:crypto";
import { URLSearchParams } from "node:url";
import request from "supertest";

import { TestDataHelper } from "../../../integration/helpers/test-data.helper";

describe("Protocolos - E2E", () => {
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
        header: false,
        header_campo: "",
        header_valor: "",
        headers_adicionais: [],
        ativado: true,
      },
    });
  };

  const createReenviarSuccessFlow = async () => {
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

    const record = await WebhookReprocessado.findOne();

    expect(record).toBeTruthy();

    return {
      scenario,
      headers,
      payload,
      response,
    };
  };

  it("deve retornar um protocolo salvo a partir do UUID", async () => {
    const { scenario, headers, response } = await createReenviarSuccessFlow();

    const protocoloId = response.body.protocolo;

    const getResponse = await request(app)
      .get(`/protocolos/${protocoloId}`)
      .set(headers);

    expect(getResponse.status).toBe(200);
    const {
      protocolo,
      cedente_id: cedenteId,
      product,
      kind,
      type,
      servico_id: servicoId,
    } = getResponse.body;

    expect(protocolo).toBe(protocoloId);
    expect(cedenteId).toBe(scenario.cedente.id);
    expect(product).toBe("BOLETO");
    expect(kind).toBe("webhook");
    expect(type).toBe("disponivel");

    const returnedServiceIds = Array.isArray(servicoId)
      ? servicoId
      : JSON.parse(servicoId);
    expect(returnedServiceIds).toEqual([scenario.servico.id.toString()]);

    const cacheKey = `protocolo:${scenario.cedente.id}:${protocoloId}`;
    const cacheValue = await CacheService.getInstance().get(cacheKey);
    expect(cacheValue).not.toBeNull();
    const cachedRecord = JSON.parse(cacheValue as string);
    expect(cachedRecord).toMatchObject({ protocolo: protocoloId });

    // Segunda chamada deve responder pelo cache
    const cachedResponse = await request(app)
      .get(`/protocolos/${protocoloId}`)
      .set(headers);

    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.body).toEqual(getResponse.body);
  });

  it("deve listar protocolos com filtros e paginação", async () => {
    const scenario = await TestDataHelper.createTestScenario();
    await enableWebhookConfiguration(scenario.conta);

    const headers = buildHeaders(scenario);

    const matchingRecord = await TestDataHelper.createWebhookReprocessado(
      scenario.cedente.id,
      {
        servico_id: [scenario.servico.id.toString()],
        product: "BOLETO",
        type: "disponivel",
        kind: "webhook",
        protocolo: randomUUID(),
        data: { notifications: [] },
        data_criacao: new Date(),
      },
    );

    await TestDataHelper.createWebhookReprocessado(scenario.cedente.id, {
      servico_id: ["9999"],
      product: "PIX",
      type: "pago",
      kind: "webhook",
      protocolo: randomUUID(),
      data: { notifications: [] },
      data_criacao: new Date(),
    });

    const startDate = new Date(Date.now() - 60 * 1000);
    const endDate = new Date(Date.now() + 60 * 1000);
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const params = new URLSearchParams();
    params.append("start_date", startIso);
    params.append("end_date", endIso);
    params.append("product", "boleto");
    params.append("kind", "webhook");
    params.append("type", "disponivel");
    params.append("page", "1");
    params.append("limit", "10");

    const queryString = params.toString();

    const response = await request(app)
      .get(`/protocolos?${queryString}`)
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      protocolo: matchingRecord.protocolo,
      product: "BOLETO",
      type: "disponivel",
    });

    const listedServiceIds = Array.isArray(response.body.data[0].servico_id)
      ? response.body.data[0].servico_id
      : JSON.parse(response.body.data[0].servico_id);
    expect(listedServiceIds).toContain(scenario.servico.id.toString());
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      total_pages: 1,
    });

    const cacheKey = `protocolos:${scenario.cedente.id}:BOLETO:undefined:disponivel:webhook:${startIso}:${endIso}:1:10`;
    const cacheValue = await CacheService.getInstance().get(cacheKey);
    expect(cacheValue).not.toBeNull();
    expect(JSON.parse(cacheValue as string)).toEqual(response.body);

    const cachedResponse = await request(app)
      .get(`/protocolos?${queryString}`)
      .set(headers);

    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.body).toEqual(response.body);
  });
});
