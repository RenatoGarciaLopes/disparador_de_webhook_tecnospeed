jest.mock("./infrastructure/config", () => ({
  config: { NODE_ENV: "test" },
}));

const useMock = jest.fn();
const listenMock = jest.fn();
const onMock = jest.fn();

jest.mock("express", () => {
  const expressMock = () => ({
    use: useMock,
    listen: listenMock.mockReturnValue({ on: onMock }),
  });
  (expressMock as any).json = jest.fn(() => "json-mw");
  return expressMock;
});

const routerMock = { router: Symbol("router") };
jest.mock("./modules/webhook/interfaces/http/routes/ReenviarRouter", () => ({
  ReenviarRouter: jest.fn().mockImplementation(() => routerMock),
}));

import express from "express";
import { App } from "./app";
import { config } from "./infrastructure/config";

describe("[CORE] App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("deve registrar express.json e o ReenviarRouter", () => {
      const jsonSpy = jest.spyOn(express as any, "json");
      const app = new App();
      expect(jsonSpy).toHaveBeenCalled();
      expect(useMock).toHaveBeenCalledTimes(2);
      expect(useMock).toHaveBeenCalledWith("json-mw");
      expect(useMock).toHaveBeenCalledWith(routerMock.router);
      expect(app.server).toBeDefined();
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
        "TecnoSpeed - Webhook Dispatcher",
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
