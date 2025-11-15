import { jest } from "@jest/globals";

let capturedSlowOptions: any;
const mockSlowHandler = jest.fn();

jest.mock("express-slow-down", () => {
  return {
    __esModule: true,
    slowDown: jest.fn((options: any) => {
      capturedSlowOptions = options;
      return mockSlowHandler;
    }),
  };
});

let capturedStoreOptions: any;
const MockRedisStore = jest.fn(function (this: any, options: any) {
  capturedStoreOptions = options;
});

jest.mock("rate-limit-redis", () => {
  return {
    __esModule: true,
    RedisStore: MockRedisStore,
    default: MockRedisStore,
  };
});

const mockSendCommand = jest.fn();
const mockCacheInstance = { client: { sendCommand: mockSendCommand } };
const getInstanceSpy = jest.fn(() => mockCacheInstance);

jest.mock("../cache/cache.service", () => ({
  CacheService: { getInstance: () => getInstanceSpy() },
}));

import { ThrottleService } from "./throttle.service";

describe("[INFRA] ThrottleService", () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSlowOptions = undefined;
    capturedStoreOptions = undefined;
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("[SINGLETON] getInstance()", () => {
    it("deve retornar sempre a mesma instância", () => {
      const a = ThrottleService.getInstance();
      const b = ThrottleService.getInstance();
      expect(a).toBe(b);
    });
  });

  describe("[CONSTRUCTOR] configuração padrão", () => {
    it("deve configurar o throttle com valores padrão esperados", () => {
      const service = new ThrottleService();
      expect(service.client).toBe(mockSlowHandler);

      expect(capturedSlowOptions.windowMs).toBe(60 * 1000);
      expect(capturedSlowOptions.delayAfter).toBe(5);
      expect(capturedSlowOptions.ipv6Subnet).toBe(56);
      expect(typeof capturedSlowOptions.delayMs).toBe("function");

      expect(MockRedisStore).toHaveBeenCalledTimes(1);
      expect(capturedStoreOptions.prefix).toBe("throttle");
      expect(typeof capturedStoreOptions.sendCommand).toBe("function");
    });
  });

  describe("[CONSTRUCTOR] configuração customizada", () => {
    it("deve aceitar limit, interval e delayMs customizados", () => {
      new ThrottleService(7, 30_000, 250);
      expect(capturedSlowOptions.delayAfter).toBe(7);
      expect(capturedSlowOptions.windowMs).toBe(30_000);
      expect(typeof capturedSlowOptions.delayMs).toBe("function");
    });
  });

  describe("[DELAY] função delayMs", () => {
    it("deve retornar hits * delayMs e logar os hits", () => {
      new ThrottleService(3, 1_000, 200);
      const result = capturedSlowOptions.delayMs(4);
      expect(console.log).toHaveBeenCalledWith("hits", 4);
      expect(result).toBe(4 * 200);
    });
  });

  describe("[STORE] integração com CacheService", () => {
    it("deve encaminhar sendCommand corretamente para o cliente do cache", async () => {
      new ThrottleService();
      capturedStoreOptions.sendCommand("P", "Q", "R");
      expect(getInstanceSpy).toHaveBeenCalled();
      expect(mockSendCommand).toHaveBeenCalledWith(["P", "Q", "R"]);
    });
  });
});
