import { jest } from "@jest/globals";

let capturedRateLimitOptions: any;
const mockRateLimitHandler = jest.fn();

jest.mock("express-rate-limit", () => {
  const mock = jest.fn((options: any) => {
    capturedRateLimitOptions = options;
    return mockRateLimitHandler;
  });
  return { __esModule: true, default: mock };
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
  CacheService: {
    getInstance: () => getInstanceSpy(),
  },
}));

import { RateLimitService } from "./rate-limit.service";

describe("[INFRA] RateLimitService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedRateLimitOptions = undefined;
    capturedStoreOptions = undefined;
  });

  describe("[SINGLETON] getInstance()", () => {
    it("deve retornar sempre a mesma instância", () => {
      const a = RateLimitService.getInstance();
      const b = RateLimitService.getInstance();
      expect(a).toBe(b);
    });
  });

  describe("[CONSTRUCTOR] configuração padrão", () => {
    it("deve configurar o rate limit com valores padrão esperados", () => {
      const service = new RateLimitService();
      expect(service.client).toBe(mockRateLimitHandler);

      expect(capturedRateLimitOptions.windowMs).toBe(15 * 60 * 1000);
      expect(capturedRateLimitOptions.limit).toBe(100);
      expect(capturedRateLimitOptions.standardHeaders).toBe("draft-8");
      expect(capturedRateLimitOptions.legacyHeaders).toBe(false);
      expect(capturedRateLimitOptions.ipv6Subnet).toBe(56);

      // store deve ser instanciado com prefix correto
      expect(MockRedisStore).toHaveBeenCalledTimes(1);
      expect(capturedStoreOptions.prefix).toBe("rate-limit");
      expect(typeof capturedStoreOptions.sendCommand).toBe("function");
    });
  });

  describe("[CONSTRUCTOR] configuração customizada", () => {
    it("deve aceitar limit e interval customizados", () => {
      new RateLimitService(10, 10_000);
      expect(capturedRateLimitOptions.limit).toBe(10);
      expect(capturedRateLimitOptions.windowMs).toBe(10_000);
    });
  });

  describe("[STORE] integração com CacheService", () => {
    it("deve encaminhar sendCommand corretamente para o cliente do cache", async () => {
      new RateLimitService();
      // simula uso do store pela lib externa
      capturedStoreOptions.sendCommand("SET", "key", "value");
      expect(getInstanceSpy).toHaveBeenCalled();
      expect(mockSendCommand).toHaveBeenCalledWith(["SET", "key", "value"]);
    });
  });

  describe("[HANDLER] resposta quando limite é excedido", () => {
    it("deve retornar 429 e payload de erro padronizado", () => {
      new RateLimitService();
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // executa handler customizado configurado no rate limit
      capturedRateLimitOptions.handler({}, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        code: "TOO_MANY_REQUESTS",
        statusCode: 429,
        error: {
          errors: [
            "Você atingiu o limite de requisições. Tente novamente mais tarde.",
          ],
        },
      });
    });
  });
});
