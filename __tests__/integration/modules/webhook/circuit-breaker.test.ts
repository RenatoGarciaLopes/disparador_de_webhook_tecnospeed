import { App } from "@/app";
import axios, { AxiosError } from "axios";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");
  return {
    ...actualAxios,
    post: jest.fn(),
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Circuit Breaker - Integration Tests", () => {
  let app: Express;
  let testData: any;

  beforeAll(async () => {
    // Configurar circuit breaker com thresholds baixos para testes rápidos
    process.env.CB_VOLUME_THRESHOLD = "3";
    process.env.CB_ERROR_THRESHOLD_PERCENT = "50";
    process.env.CB_RESET_TIMEOUT_MS = "1000";

    await TestDataHelper.initialize();
    app = new App().server;
  });

  beforeEach(async () => {
    await TestDataHelper.cleanup();
    testData = await TestDataHelper.createTestScenario();
    jest.clearAllMocks();

    // Habilitar webhook config
    await testData.conta.update({
      configuracao_notificacao: {
        url: "https://webhook.site/test",
        email: null,
        tipos: {},
        cancelado: true,
        pago: true,
        disponivel: true,
        header: false,
        ativado: true,
        header_campo: "",
        header_valor: "",
        headers_adicionais: [],
      },
    });
  });

  afterAll(async () => {
    await TestDataHelper.cleanup();
    delete process.env.CB_VOLUME_THRESHOLD;
    delete process.env.CB_ERROR_THRESHOLD_PERCENT;
    delete process.env.CB_RESET_TIMEOUT_MS;
  });

  describe("Sucesso", () => {
    it("deve processar requisição com sucesso quando circuit breaker está fechado", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { protocolo: "PROTO-SUCCESS" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: [testData.servico.id.toString()],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(200);
      expect(response.body.protocolo).toBe("PROTO-SUCCESS");
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe("Circuit Breaker com falhas 5xx", () => {
    it("deve tratar múltiplas falhas 5xx e manter o serviço estável", async () => {
      // Simular falhas 5xx
      const error500 = new AxiosError("Internal Server Error");
      error500.response = {
        status: 500,
        statusText: "Internal Server Error",
        data: { error: "Internal Server Error" },
        headers: {},
        config: {} as any,
      };
      error500.isAxiosError = true;

      mockedAxios.post.mockRejectedValue(error500);

      // Fazer múltiplas chamadas que falham
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app)
            .post("/reenviar")
            .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
            .set("x-api-token-sh", testData.softwareHouse.token)
            .set("x-api-cnpj-cedente", testData.cedente.cnpj)
            .set("x-api-token-cedente", testData.cedente.token)
            .send({
              product: "boleto",
              id: [testData.servico.id.toString()],
              kind: "webhook",
              type: "disponivel",
            }),
        ),
      );

      // Todas devem retornar erro 500 (mas o serviço não deve cair)
      responses.forEach((response) => {
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
      });

      // Verificar que axios foi chamado (circuit breaker está funcionando)
      expect(mockedAxios.post.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Erros 4xx não abrem o circuit breaker", () => {
    it("deve permitir múltiplas requisições com erro 4xx sem abrir o breaker", async () => {
      // Simular erros 4xx
      const error400 = new AxiosError("Bad Request");
      error400.response = {
        status: 400,
        statusText: "Bad Request",
        data: { error: "Bad Request" },
        headers: {},
        config: {} as any,
      };
      error400.isAxiosError = true;

      mockedAxios.post.mockRejectedValue(error400);

      // Múltiplas chamadas com 4xx - breaker não deve abrir
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/reenviar")
          .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
          .set("x-api-token-sh", testData.softwareHouse.token)
          .set("x-api-cnpj-cedente", testData.cedente.cnpj)
          .set("x-api-token-cedente", testData.cedente.token)
          .send({
            product: "boleto",
            id: [testData.servico.id.toString()],
            kind: "webhook",
            type: "disponivel",
          });

        expect(response.status).toBe(500); // Erro é mapeado para 500 pela aplicação
        // Verificar que axios foi chamado em todas as tentativas (breaker não abriu)
        expect(mockedAxios.post).toHaveBeenCalledTimes(i + 1);
      }

      // Após 5 chamadas com 4xx, axios ainda deve ser chamado (breaker não abriu)
      expect(mockedAxios.post).toHaveBeenCalledTimes(5);
    });
  });
});
