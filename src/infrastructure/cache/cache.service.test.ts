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
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Cache connection error:",
        testError,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("[CONNECT] connect()", () => {
    let consoleLogSpy: jest.SpiedFunction<jest.Mock>;
    let consoleErrorSpy: jest.SpiedFunction<jest.Mock>;

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

    it("deve conectar quando client não estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockResolvedValue(undefined as never);

      await service.connect();

      expect(consoleLogSpy).toHaveBeenCalledWith("[debug] Connecting to Cache");
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith("[debug] Cache connected");
    });

    it("não deve conectar quando client já estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;

      await service.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        "[debug] Connecting to Cache",
      );
    });

    it("deve propagar erro quando conexão falhar", async () => {
      const service = CacheService.getInstance();
      const error = new Error("Connection failed");
      mockRedisClient.isOpen = false;
      mockRedisClient.connect.mockRejectedValue(error as never);

      await expect(service.connect()).rejects.toThrow("Connection failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Cache connection error:",
        error,
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
    });

    it("deve executar flushAll sem conectar quando client já estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      mockRedisClient.flushAll.mockResolvedValue("OK" as never);

      await service.flushAll();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(mockRedisClient.flushAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("[COMMANDS] quit()", () => {
    it("deve executar quit quando client estiver aberto", async () => {
      const service = CacheService.getInstance();
      mockRedisClient.isOpen = true;
      mockRedisClient.quit.mockResolvedValue(undefined as never);

      await service.quit();

      expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
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
