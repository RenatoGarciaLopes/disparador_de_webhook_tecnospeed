jest.mock("./infrastructure/config", () => ({
  config: { NODE_ENV: "test" },
}));

const serveMock = jest.fn();
const setupMock = jest.fn();
const useMock = jest.fn();
const listenMock = jest.fn();
const onMock = jest.fn();
const getMock = jest.fn();

jest.mock("swagger-ui-express", () => ({
  serve: serveMock,
  setup: setupMock,
}));

jest.mock("express", () => {
  const expressMock = () => ({
    use: useMock,
    listen: listenMock.mockReturnValue({ on: onMock }),
    get: getMock,
  });
  (expressMock as any).json = jest.fn(() => "json-mw");
  return expressMock;
});

const protocolosRouterMock = { router: Symbol("router") };
jest.mock(
  "./modules/protocolo/interfaces/http/routes/ProtocolosRoutes",
  () => ({
    ProtocolosRoutes: jest.fn().mockImplementation(() => protocolosRouterMock),
  }),
);

const reenviarRouterMock = { router: Symbol("router") };
jest.mock("./modules/webhook/interfaces/http/routes/ReenviarRouter", () => ({
  ReenviarRouter: jest.fn().mockImplementation(() => reenviarRouterMock),
}));

const mockOpenApiDocument = { openapi: "3.0.3", info: { title: "Test" } };
jest.mock("./infrastructure/docs/openapi", () => ({
  getOpenApiDocument: jest.fn(() => mockOpenApiDocument),
}));

import express from "express";
import { App } from "./app";
import { config } from "./infrastructure/config";
import { getOpenApiDocument } from "./infrastructure/docs/openapi";

describe("[CORE] App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("deve registrar express.json, o ProtocolosRoutes e o ReenviarRouter", () => {
      const jsonSpy = jest.spyOn(express as any, "json");
      const app = new App();
      expect(jsonSpy).toHaveBeenCalled();
      expect(useMock).toHaveBeenCalledTimes(4);
      expect(useMock).toHaveBeenCalledWith("json-mw");
      expect(useMock).toHaveBeenCalledWith(protocolosRouterMock.router);
      expect(useMock).toHaveBeenCalledWith(reenviarRouterMock.router);
      expect(getMock).toHaveBeenCalledWith("/docs.json", expect.any(Function));
      expect(app.server).toBeDefined();
    });

    it("deve configurar /docs.json para retornar documentação OpenAPI", () => {
      new App();
      expect(getOpenApiDocument).toHaveBeenCalled();

      // Verifica se o handler registrado chama getOpenApiDocument
      const getCall = getMock.mock.calls.find(
        (call) => call[0] === "/docs.json",
      );
      expect(getCall).toBeDefined();

      const resMock = { json: jest.fn() };
      getCall![1]({}, resMock);

      expect(resMock.json).toHaveBeenCalledWith(mockOpenApiDocument);
    });
  });

  describe("start", () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });
    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("deve ligar na porta e logar informações", () => {
      const app = new App();
      app.start(1234);

      expect(listenMock).toHaveBeenCalledWith(1234, expect.any(Function));

      const listenCb = listenMock.mock.calls[0][1] as () => void;
      listenCb();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "--------------------------------",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Tecnospeed - Webhook Dispatcher",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "--------------------------------",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `🌐 Environment: ${config.NODE_ENV}`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🚀 Server is running on port: 1234",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🔗 Access: http://localhost:1234/docs",
      );
    });

    it("deve encadear on('error', console.error)", () => {
      const app = new App();
      app.start(3000);
      expect(onMock).toHaveBeenCalledWith("error", console.error);
    });
  });
});
