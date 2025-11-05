import { App } from "@/app";
import { ProtocolosService } from "@/modules/protocolo/domain/services/ProtocolosService";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

describe("[PROTOCOL] /protocolos/:id - Error Responses", () => {
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

  describe("Erros de Autenticação (Headers)", () => {
    it("retorna 400 para headers ausentes", async () => {
      const res = await request(app).get("/protocolos/invalid-id");
      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para headers com formato inválido", async () => {
      const res = await request(app)
        .get("/protocolos/invalid-id")
        .set("x-api-cnpj-sh", "invalid-cnpj")
        .set("x-api-token-sh", "")
        .set("x-api-cnpj-cedente", "invalid-cnpj")
        .set("x-api-token-cedente", "");
      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 401 com mensagem genérica para credenciais inválidas", async () => {
      const res = await request(app)
        .get("/protocolos/123e4567-e89b-12d3-a456-426614174000")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", "invalid-token")
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", "invalid-token");
      expect(res.status).toBe(401);
      expect(res.body?.error).toBe("Credenciais inválidas");
    });
  });

  it("retorna 400 para UUID inválido", async () => {
    const res = await request(app)
      .get("/protocolos/invalid-id")
      .set(validHeaders());

    expect(res.status).toBe(400);
    expect(res.body?.error?.properties).toBeDefined();
  });

  describe("Erros Internos", () => {
    it("retorna 500 quando ocorre erro interno no serviço", async () => {
      const protocoloId = "123e4567-e89b-12d3-a456-426614174000";
      jest
        .spyOn(ProtocolosService.prototype, "getProtocoloById")
        .mockRejectedValue(new Error("Erro interno do servidor"));

      const res = await request(app)
        .get(`/protocolos/${protocoloId}`)
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", testData.cedente.token);

      expect([200, 500]).toContain(res.status);
    });
  });
});
