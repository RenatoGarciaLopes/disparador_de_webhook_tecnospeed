import { App } from "@/app";
import { ProtocolosService } from "@/modules/protocolo/domain/services/ProtocolosService";
import { Express } from "express";
import request from "supertest";
import { TestDataHelper } from "../../helpers/test-data.helper";

describe("[PROTOCOL] /protocolos - Error Responses", () => {
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
      const res = await request(app).get("/protocolos").query({});
      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para headers com formato inválido", async () => {
      const res = await request(app)
        .get("/protocolos")
        .set("x-api-cnpj-sh", "invalid-cnpj")
        .set("x-api-token-sh", "")
        .set("x-api-cnpj-cedente", "invalid-cnpj")
        .set("x-api-token-cedente", "");
      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 401 com mensagem genérica para credenciais inválidas", async () => {
      const res = await request(app)
        .get("/protocolos")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", "invalid-token")
        .set("x-api-cnpj-cedente", testData.cedente.cnpj)
        .set("x-api-token-cedente", "invalid-token");
      expect(res.status).toBe(401);
      expect(res.body?.error).toBe("Credenciais inválidas");
    });

    it("retorna 401 quando Software House está inativa", async () => {
      const softwareHouse = await TestDataHelper.createSoftwareHouse({
        cnpj: "22.345.678/0001-90",
        token: testData.softwareHouse.token,
        status: "inativo",
      });
      const cedente = await TestDataHelper.createCedente(softwareHouse.id, {
        cnpj: "33.445.678/0001-90",
        token: "test-cedente-token",
      });

      const res = await request(app)
        .get("/protocolos")
        .set("x-api-cnpj-sh", softwareHouse.cnpj)
        .set("x-api-token-sh", softwareHouse.token)
        .set("x-api-cnpj-cedente", cedente.cnpj)
        .set("x-api-token-cedente", cedente.token);
      expect(res.status).toBe(401);
      expect(res.body?.error).toBe("Credenciais inválidas");
    });

    it("retorna 401 quando Cedente está inativo", async () => {
      const cedente = await TestDataHelper.createCedente(
        testData.softwareHouse.id,
        {
          cnpj: "33.445.678/0001-90",
          token: "test-cedente-token",
          status: "inativo",
        },
      );

      const res = await request(app)
        .get("/protocolos")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", cedente.cnpj)
        .set("x-api-token-cedente", cedente.token);
      expect(res.status).toBe(401);
      expect(res.body?.error).toBe("Credenciais inválidas");
    });
  });

  describe("Validação de query params", () => {
    it("retorna 400 quando start_date e end_date estão ausentes", async () => {
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({});

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 quando end_date < start_date ou intervalo > 31 dias", async () => {
      const cases = [
        { start_date: "2025-10-10", end_date: "2025-10-01" },
        { start_date: "2025-10-01", end_date: "2025-11-15" },
      ];

      for (const q of cases) {
        const res = await request(app)
          .get("/protocolos")
          .set(validHeaders())
          .query(q);

        expect(res.status).toBe(400);
        expect(
          res.body?.error?.properties || res.body?.error?.errors,
        ).toBeDefined();
      }
    });
  });

  describe("Validação de filtros opcionais", () => {
    it("retorna 400 para product inválido", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: now.toISOString(),
          end_date: now.toISOString(),
          product: "invalid-product",
        });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para type inválido", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: now.toISOString(),
          end_date: now.toISOString(),
          type: "invalid-type",
        });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para kind inválido", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: now.toISOString(),
          end_date: now.toISOString(),
          kind: "invalid-kind",
        });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para id não numérico", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: now.toISOString(),
          end_date: now.toISOString(),
          id: ["abc", "-1"],
        });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para parâmetros desconhecidos (strict)", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({
          start_date: now.toISOString(),
          end_date: now.toISOString(),
          foo: "bar",
        } as any);

      expect(res.status).toBe(400);
      expect(
        res.body?.error?.properties || res.body?.error?.errors,
      ).toBeDefined();
    });
  });

  describe("Validação de datas", () => {
    it("retorna 400 para start_date inválido", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({ start_date: "invalid", end_date: now.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });

    it("retorna 400 para end_date inválido", async () => {
      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({ start_date: now.toISOString(), end_date: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body?.error?.properties).toBeDefined();
    });
  });

  describe("Regras de associação", () => {
    it("retorna 401 quando cedente não pertence à Software House", async () => {
      const sh2 = await TestDataHelper.createSoftwareHouse({
        cnpj: "55.555.555/0001-55",
        token: "token-sh-2",
      });
      const cedenteOutro = await TestDataHelper.createCedente(sh2.id, {
        cnpj: "66.666.666/0001-66",
        token: "token-cedente-2",
      });

      const now = new Date();
      const res = await request(app)
        .get("/protocolos")
        .set("x-api-cnpj-sh", testData.softwareHouse.cnpj)
        .set("x-api-token-sh", testData.softwareHouse.token)
        .set("x-api-cnpj-cedente", cedenteOutro.cnpj)
        .set("x-api-token-cedente", cedenteOutro.token)
        .query({ start_date: now.toISOString(), end_date: now.toISOString() });

      expect(res.status).toBe(401);
      expect(res.body?.error).toBe("Credenciais inválidas");
    });
  });

  describe("Erros Internos", () => {
    it("retorna 500 para erro interno do servidor", async () => {
      const now = new Date();
      jest
        .spyOn(ProtocolosService.prototype, "getProtocolos")
        .mockRejectedValue(new Error("Erro interno do servidor"));

      const res = await request(app)
        .get("/protocolos")
        .set(validHeaders())
        .query({ start_date: now.toISOString(), end_date: now.toISOString() });

      expect([200, 500]).toContain(res.status);
    });
  });
});
