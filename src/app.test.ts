jest.mock("./infrastructure/config", () => ({
  config: { NODE_ENV: "test" },
}));

jest.mock("@/infrastructure/logger/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
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

import { Logger } from "@/infrastructure/logger/logger";
import express from "express";
import { App } from "./app";
import { config } from "./infrastructure/config";
import { getOpenApiDocument } from "./infrastructure/docs/openapi";

describe("[CORE] App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
    it("deve ligar na porta e logar informações", () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      const app = new App();
      app.start(1234);

      expect(listenMock).toHaveBeenCalledWith(1234, expect.any(Function));

      const listenCb = listenMock.mock.calls[0][1] as () => void;
      listenCb();

      expect(Logger.info).toHaveBeenCalledWith(
        `HTTP server started successfully on port 1234 (env: ${config.NODE_ENV})`,
      );

      // Avança o timer para executar o setTimeout
      jest.advanceTimersByTime(5 * 1000);

      // Verifica se os console.log foram chamados com as mensagens corretas
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "--------------------------------",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Tecnospeed - Webhook Dispatcher",
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

      consoleLogSpy.mockRestore();
    });

    it("deve encadear on('error', handler)", () => {
      const app = new App();
      app.start(3000);
      expect(onMock).toHaveBeenCalledWith("error", expect.any(Function));

      const errorHandler = onMock.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1] as (error: Error) => void;
      const testError = new Error("Test error");
      errorHandler(testError);

      expect(Logger.error).toHaveBeenCalledWith(
        `HTTP server error: ${testError.message}`,
      );
    });
  });
});
