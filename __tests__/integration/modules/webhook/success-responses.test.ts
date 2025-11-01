import { App } from "@/app";
import { TecnospeedClient } from "@/infrastructure/tecnospeed/TecnospeedClient";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

describe("Success Responses - Integration Tests", () => {
  let app: Express;
  let testData: any;
  let tecnospeedSpy: jest.SpyInstance;

  beforeAll(async () => {
    await TestDataHelper.initialize();
    app = new App().server;
  });

  beforeEach(async () => {
    await TestDataHelper.cleanup();
    testData = await TestDataHelper.createTestScenario();
    tecnospeedSpy = jest
      .spyOn(TecnospeedClient.prototype, "reenviarWebhook")
      .mockReset();
  });

  afterAll(async () => {
    await TestDataHelper.cleanup();
  });

  const enableContaWebhookConfig = async () => {
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
  };

  describe("Casos de sucesso", () => {
    it("deve retornar 200 e protocolo para requisição válida (BOLETO)", async () => {
      await enableContaWebhookConfig();

      tecnospeedSpy.mockResolvedValue({ protocolo: "PROTO-123" });

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
      expect(response.body).toEqual({
        message: "Notificação reenviada com sucesso",
        protocolo: "PROTO-123",
      });
      expect(tecnospeedSpy).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 200 para múltiplos IDs do mesmo convênio (BOLETO)", async () => {
      await enableContaWebhookConfig();

      const outroServico = await TestDataHelper.createServico(
        testData.convenio.id,
        { situacao: "disponivel" },
      );

      tecnospeedSpy.mockResolvedValue({ protocolo: "PROTO-456" });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "boleto",
          id: [testData.servico.id.toString(), outroServico.id.toString()],
          kind: "webhook",
          type: "disponivel",
        });

      expect(response.status).toBe(200);
      expect(response.body?.protocolo).toBe("PROTO-456");
      expect(tecnospeedSpy).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 200 para product PIX com type pago", async () => {
      await enableContaWebhookConfig();

      const convenioPix = await TestDataHelper.createConvenio(
        testData.conta.id,
      );
      const servicoPix = await TestDataHelper.createServico(convenioPix.id, {
        produto: "PIX",
        situacao: "pago",
      });

      tecnospeedSpy.mockResolvedValue({ protocolo: "PROTO-PIX" });

      const response = await request(app)
        .post("/reenviar")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token)
        .send({
          product: "pix",
          id: [servicoPix.id.toString()],
          kind: "webhook",
          type: "pago",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Notificação reenviada com sucesso",
        protocolo: "PROTO-PIX",
      });
      expect(tecnospeedSpy).toHaveBeenCalledTimes(1);
    });
  });
});
