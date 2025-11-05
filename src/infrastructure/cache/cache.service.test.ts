import { jest } from "@jest/globals";

const mockRedisClient = {
  connect: jest.fn(),
  on: jest.fn(),
  set: jest.fn(),
  exists: jest.fn(),
  get: jest.fn(),
  flushAll: jest.fn(),
  quit: jest.fn(),
  isOpen: false,
};

jest.mock("redis", () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

jest.mock("../config", () => ({
  config: {
    REDIS_HOST: "redis-host",
    REDIS_PORT: 6380,
    REDIS_PASSWORD: "secret",
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

import { Logger } from "@/infrastructure/logger/logger";
import { CacheService } from "./cache.service";

describe("[INFRA] CacheService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (CacheService as any).instance = null;
    mockRedisClient.isOpen = false;
  });

  describe("[SINGLETON] getInstance", () => {
    it("deve retornar a mesma instância sempre", () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("deve registrar handler de erro do client Redis", () => {
      CacheService.getInstance();

      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );

      const errorHandler = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1] as (err: Error) => void;

      const testError = new Error("Redis client error");
      errorHandler(testError);

      expect(Logger.error).toHaveBeenCalledWith(
        "Redis connection error: Redis client error",
      );
    });
  });

  describe("[CONNECT] connect()", () => {
    it("deve conectar quando client não estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockResolvedValue(undefined as never);

      await service.connect();

      expect(Logger.info).toHaveBeenCalledWith("Connecting to Redis cache");
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
      expect(Logger.info).toHaveBeenCalledWith(
        "Redis cache connected successfully",
      );
    });

    it("não deve conectar quando client já estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;

      await service.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(Logger.info).not.toHaveBeenCalledWith("Connecting to Redis cache");
      expect(Logger.debug).toHaveBeenCalledWith(
        "Redis cache already connected",
      );
    });

    it("deve logar erro quando erro não é instância de Error no connect", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;
      const error = "String error" as any;
      mockRedisClient.connect.mockRejectedValue(error as never);

      await expect(service.connect()).rejects.toBe("String error");
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to connect to Redis cache: String error",
      );
    });

    it("deve propagar erro quando conexão falhar", async () => {
      const service = CacheService.getInstance();
      const error = new Error("Connection failed");
      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockRejectedValue(error as never);

      await expect(service.connect()).rejects.toThrow("Connection failed");
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to connect to Redis cache: Connection failed",
      );
    });
  });

  describe("[COMMANDS] setWithTTL()", () => {
    it("deve chamar set com parâmetros corretos", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.set.mockResolvedValue("OK" as never);

      await service.setWithTTL("test-key", "test-value", 300);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test-key",
        "test-value",
        { EX: 300, NX: true },
      );
    });

    it("deve retornar void quando set for bem-sucedido", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.set.mockResolvedValue("OK" as never);

      const result = await service.setWithTTL("key", "value", 60);
      expect(result).toBeUndefined();
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Cache set with TTL:"),
      );
    });

    it("deve logar erro quando erro não é instância de Error no setWithTTL", async () => {
      const service = CacheService.getInstance();
      const error = { code: "ERROR_CODE" } as any;
      mockRedisClient.set.mockRejectedValue(error as never);

      await expect(
        service.setWithTTL("test-key", "test-value", 300),
      ).rejects.toEqual(error);
      expect(Logger.error).toHaveBeenCalledWith(
        `Failed to set cache value: ${String(error)}`,
      );
    });

    it("deve propagar erro quando set falhar", async () => {
      const service = CacheService.getInstance();
      const error = new Error("Redis set failed");
      mockRedisClient.set.mockRejectedValue(error as never);

      await expect(
        service.setWithTTL("test-key", "test-value", 300),
      ).rejects.toThrow("Redis set failed");
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to set cache value: Redis set failed",
      );
    });
  });

  describe("[COMMANDS] exists()", () => {
    it("deve retornar true quando chave existe", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.exists.mockResolvedValue(1 as never);

      const result = await service.exists("existing-key");
      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith("existing-key");
    });

    it("deve retornar false quando chave não existe", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.exists.mockResolvedValue(0 as never);

      const result = await service.exists("non-existing-key");
      expect(result).toBe(false);
      expect(mockRedisClient.exists).toHaveBeenCalledWith("non-existing-key");
    });

    it("deve propagar erro quando exists falhar", async () => {
      const service = CacheService.getInstance();
      const error = new Error("Redis exists failed");
      mockRedisClient.exists.mockRejectedValue(error as never);

      await expect(service.exists("test-key")).rejects.toThrow(
        "Redis exists failed",
      );
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to check cache existence: Redis exists failed",
      );
    });

    it("deve logar erro quando erro não é instância de Error no exists", async () => {
      const service = CacheService.getInstance();
      const error = 500 as any;
      mockRedisClient.exists.mockRejectedValue(error as never);

      await expect(service.exists("test-key")).rejects.toBe(500);
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to check cache existence: 500",
      );
    });
  });

  describe("[COMMANDS] get()", () => {
    it("deve retornar valor quando chave existe", async () => {
      const service = CacheService.getInstance();
      const expectedValue = "cached-value";
      mockRedisClient.get.mockResolvedValue(expectedValue as never);

      const result = await service.get("existing-key");
      expect(result).toBe(expectedValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith("existing-key");
    });

    it("deve retornar null quando chave não existe", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.get.mockResolvedValue(null as never);

      const result = await service.get("non-existing-key");
      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith("non-existing-key");
    });

    it("deve propagar erro quando get falhar", async () => {
      const service = CacheService.getInstance();
      const error = new Error("Redis get failed");
      mockRedisClient.get.mockRejectedValue(error as never);

      await expect(service.get("test-key")).rejects.toThrow("Redis get failed");
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to get cache value: Redis get failed",
      );
    });

    it("deve logar erro quando erro não é instância de Error no get", async () => {
      const service = CacheService.getInstance();
      const error = null as any;
      mockRedisClient.get.mockRejectedValue(error as never);

      await expect(service.get("test-key")).rejects.toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to get cache value: null",
      );
    });
  });

  describe("[COMMANDS] flushAll()", () => {
    it("deve conectar e executar flushAll quando client não estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockResolvedValue(undefined as never);
      mockRedisClient.flushAll.mockResolvedValue("OK" as never);

      await service.flushAll();

      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.flushAll).toHaveBeenCalledTimes(1);
      expect(Logger.warn).toHaveBeenCalledWith(
        "Cache flushed (all keys removed)",
      );
    });

    it("deve executar flushAll sem conectar quando client já estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      mockRedisClient.flushAll.mockResolvedValue("OK" as never);

      await service.flushAll();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(mockRedisClient.flushAll).toHaveBeenCalledTimes(1);
      expect(Logger.warn).toHaveBeenCalledWith(
        "Cache flushed (all keys removed)",
      );
    });

    it("deve propagar erro quando flushAll falhar", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      const error = new Error("Redis flushAll failed");
      mockRedisClient.flushAll.mockRejectedValue(error as never);

      await expect(service.flushAll()).rejects.toThrow("Redis flushAll failed");
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to flush cache: Redis flushAll failed",
      );
    });

    it("deve propagar erro quando conexão falhar durante flushAll", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;
      const error = new Error("Connection failed during flushAll");
      mockRedisClient.connect.mockRejectedValue(error as never);

      await expect(service.flushAll()).rejects.toThrow(
        "Connection failed during flushAll",
      );
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to flush cache: Connection failed during flushAll",
      );
    });

    it("deve logar erro quando erro não é instância de Error no flushAll", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      const error = ["array", "error"] as any;
      mockRedisClient.flushAll.mockRejectedValue(error as never);

      await expect(service.flushAll()).rejects.toEqual(error);
      expect(Logger.error).toHaveBeenCalledWith(
        `Failed to flush cache: ${String(error)}`,
      );
    });
  });

  describe("[COMMANDS] quit()", () => {
    it("deve executar quit quando client estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      mockRedisClient.quit.mockResolvedValue(undefined as never);

      await service.quit();

      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
      expect(Logger.info).toHaveBeenCalledWith("Redis cache connection closed");
    });

    it("não deve executar quit quando client não estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;

      await service.quit();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });

  describe("[INTEGRATION] fluxo completo", () => {
    it("deve permitir operações após conexão", async () => {
      const service = CacheService.getInstance();

      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockResolvedValue(undefined as never);
      mockRedisClient.set.mockResolvedValue("OK" as never);
      mockRedisClient.exists.mockResolvedValue(1 as never);
      mockRedisClient.get.mockResolvedValue("test-value" as never);

      await service.connect();

      await service.setWithTTL("key", "value", 60);
      const exists = await service.exists("key");
      const value = await service.get("key");

      expect(exists).toBe(true);
      expect(value).toBe("test-value");
    });
  });
});
