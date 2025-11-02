import { config } from "@/infrastructure/config";
import { AxiosError } from "axios";
import { buildCircuitBreakerFor } from "./circuit-breaker.service";

jest.mock("@/infrastructure/config", () => ({
  config: {
    CB_TIMEOUT_MS: 1000,
    CB_RESET_TIMEOUT_MS: 2000,
    CB_ERROR_THRESHOLD_PERCENT: 50,
    CB_VOLUME_THRESHOLD: 5,
  },
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

let mockCircuitBreaker: jest.Mock;

jest.mock("opossum", () => {
  const mockBreaker = {
    on: jest.fn(),
    fire: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    halfOpen: jest.fn(),
    stats: {
      fires: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rejections: 0,
      failures: 0,
      timeouts: 0,
      successes: 0,
    },
    options: {} as any,
  };

  const CircuitBreaker = jest.fn().mockImplementation((action, options) => {
    mockBreaker.options = options;
    mockBreaker.fire = jest.fn().mockImplementation((...args) => {
      return Promise.resolve(action(...args));
    });
    return mockBreaker;
  });

  return {
    __esModule: true,
    default: CircuitBreaker,
  };
});

import { Logger } from "@/infrastructure/logger/logger";

describe("[INFRA] circuit-breaker.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCircuitBreaker = require("opossum").default;
    mockCircuitBreaker.mockClear();
  });

  describe("buildCircuitBreakerFor", () => {
    it("deve criar circuit breaker com configurações do config", () => {
      const mockAction = jest.fn().mockResolvedValue("success");

      buildCircuitBreakerFor("test-breaker", mockAction);

      expect(mockCircuitBreaker).toHaveBeenCalledWith(mockAction, {
        timeout: config.CB_TIMEOUT_MS,
        resetTimeout: config.CB_RESET_TIMEOUT_MS,
        errorThresholdPercentage: config.CB_ERROR_THRESHOLD_PERCENT,
        volumeThreshold: config.CB_VOLUME_THRESHOLD,
        errorFilter: expect.any(Function),
      });
    });

    it("deve registrar todos os event listeners", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      expect(breaker.on).toHaveBeenCalledWith("open", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("halfOpen", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("close", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("reject", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("timeout", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("failure", expect.any(Function));
      expect(breaker.on).toHaveBeenCalledWith("success", expect.any(Function));
    });

    it("deve logar evento 'open' quando breaker abre", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const openHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "open",
      )?.[1];

      expect(openHandler).toBeDefined();
      openHandler();
      expect(Logger.warn).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] state changed: open",
      );
    });

    it("deve logar evento 'halfOpen' quando breaker entra em half-open", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const halfOpenHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "halfOpen",
      )?.[1];

      expect(halfOpenHandler).toBeDefined();
      halfOpenHandler();
      expect(Logger.info).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] state changed: halfOpen",
      );
    });

    it("deve logar evento 'close' quando breaker fecha", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const closeHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "close",
      )?.[1];

      expect(closeHandler).toBeDefined();
      closeHandler();
      expect(Logger.info).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] state changed: close",
      );
    });

    it("deve logar evento 'reject' quando chamada é rejeitada", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const rejectHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "reject",
      )?.[1];

      expect(rejectHandler).toBeDefined();
      rejectHandler();
      expect(Logger.warn).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] short-circuited request",
      );
    });

    it("deve logar evento 'timeout' quando ocorre timeout", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const timeoutHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "timeout",
      )?.[1];

      expect(timeoutHandler).toBeDefined();
      timeoutHandler();
      expect(Logger.warn).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] action timed out",
      );
    });

    it("deve logar evento 'failure' quando ocorre falha", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const failureHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "failure",
      )?.[1];

      expect(failureHandler).toBeDefined();
      const error = new Error("test error");
      failureHandler(error);
      expect(Logger.error).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] action failed: test error",
      );
    });

    it("deve logar evento 'success' quando ação é bem-sucedida", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      const successHandler = (breaker.on as jest.Mock).mock.calls.find(
        (call) => call[0] === "success",
      )?.[1];

      expect(successHandler).toBeDefined();
      successHandler();
      expect(Logger.info).toHaveBeenCalledWith(
        "Circuit breaker [test-breaker] action succeeded",
      );
    });

    describe("errorFilter", () => {
      it("deve ignorar erros 4xx (não contar para abrir o breaker)", () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        buildCircuitBreakerFor("test-breaker", mockAction);

        const options =
          mockCircuitBreaker.mock.calls[
            mockCircuitBreaker.mock.calls.length - 1
          ][1];
        const errorFilter = options.errorFilter;

        const error400 = new AxiosError("Bad Request");
        error400.response = {
          status: 400,
          statusText: "Bad Request",
          data: {},
          headers: {},
          config: {} as any,
        };

        const error404 = new AxiosError("Not Found");
        error404.response = {
          status: 404,
          statusText: "Not Found",
          data: {},
          headers: {},
          config: {} as any,
        };

        const error499 = new AxiosError("Client Closed Request");
        error499.response = {
          status: 499,
          statusText: "Client Closed Request",
          data: {},
          headers: {},
          config: {} as any,
        };

        // errorFilter retorna true para ignorar (não contar como erro)
        expect(errorFilter(error400)).toBe(true);
        expect(errorFilter(error404)).toBe(true);
        expect(errorFilter(error499)).toBe(true);
      });

      it("deve contar erros 5xx como falhas", () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        buildCircuitBreakerFor("test-breaker", mockAction);

        const options =
          mockCircuitBreaker.mock.calls[
            mockCircuitBreaker.mock.calls.length - 1
          ][1];
        const errorFilter = options.errorFilter;

        const error500 = new AxiosError("Internal Server Error");
        error500.response = {
          status: 500,
          statusText: "Internal Server Error",
          data: {},
          headers: {},
          config: {} as any,
        };

        const error503 = new AxiosError("Service Unavailable");
        error503.response = {
          status: 503,
          statusText: "Service Unavailable",
          data: {},
          headers: {},
          config: {} as any,
        };

        // errorFilter retorna false para contar como erro
        expect(errorFilter(error500)).toBe(false);
        expect(errorFilter(error503)).toBe(false);
      });

      it("deve contar erros de rede/timeout como falhas", () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        buildCircuitBreakerFor("test-breaker", mockAction);

        const options =
          mockCircuitBreaker.mock.calls[
            mockCircuitBreaker.mock.calls.length - 1
          ][1];
        const errorFilter = options.errorFilter;

        const networkError = new AxiosError("Network Error");
        // sem response (erro de rede)

        const timeoutError = new Error("ETIMEDOUT");
        const genericError = new Error("Generic error");

        // errorFilter retorna false para contar como erro
        expect(errorFilter(networkError)).toBe(false);
        expect(errorFilter(timeoutError)).toBe(false);
        expect(errorFilter(genericError)).toBe(false);
      });

      it("deve tratar AxiosError sem response como falha", () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        buildCircuitBreakerFor("test-breaker", mockAction);

        const options =
          mockCircuitBreaker.mock.calls[
            mockCircuitBreaker.mock.calls.length - 1
          ][1];
        const errorFilter = options.errorFilter;

        const axiosErrorNoResponse = new AxiosError("Network Error");
        // sem response definido

        expect(errorFilter(axiosErrorNoResponse)).toBe(false);
      });

      it("deve tratar AxiosError com status 0 como falha", () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        buildCircuitBreakerFor("test-breaker", mockAction);

        const options =
          mockCircuitBreaker.mock.calls[
            mockCircuitBreaker.mock.calls.length - 1
          ][1];
        const errorFilter = options.errorFilter;

        const errorStatus0 = new AxiosError("Unknown Error");
        errorStatus0.response = {
          status: 0,
          statusText: "Unknown",
          data: {},
          headers: {},
          config: {} as any,
        };

        expect(errorFilter(errorStatus0)).toBe(false);
      });
    });

    it("deve retornar instância do circuit breaker", () => {
      const mockAction = jest.fn().mockResolvedValue("success");
      const breaker = buildCircuitBreakerFor("test-breaker", mockAction);

      expect(breaker).toBeDefined();
      expect(breaker.on).toBeDefined();
      expect(breaker.fire).toBeDefined();
    });
  });
});
