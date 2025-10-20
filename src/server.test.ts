import { App } from "./app";
import { config } from "./infrastructure/config";

jest.mock("./infrastructure/config", () => ({
  config: {
    NODE_ENV: "test",
    PORT: 3000,
    DB_USERNAME: "user",
    DB_PASSWORD: "password",
    DB_DATABASE: "database",
    DB_HOST: "localhost",
    DB_PORT: 5432,
    REDIS_PASSWORD: "redis_password",
    REDIS_PORT: 6379,
    REDIS_HOST: "localhost",
  },
}));

const mockCacheConnect = jest.fn().mockResolvedValue(undefined);
jest.mock("./infrastructure/cache/cache.service", () => {
  const instance = { connect: mockCacheConnect };
  return { CacheService: { getInstance: () => instance } };
});

const mockDbConnect = jest.fn().mockResolvedValue(true);
jest.mock("./infrastructure/database/database.service", () => {
  return {
    DatabaseService: jest
      .fn()
      .mockImplementation(() => ({ connect: mockDbConnect })),
  };
});

const mockAppStart = jest.fn();
jest.mock("./app", () => {
  return { App: jest.fn().mockImplementation(() => ({ start: mockAppStart })) };
});

describe("[CHORE] server.ts", () => {
  describe("[FUNCTION] bootstrap", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.isolateModules(() => {
        require("./server");
      });
    });

    it("deve estabelecer uma conexão com o banco de dados", async () => {
      expect(mockDbConnect).toHaveBeenCalledTimes(1);
    });

    it("deve estabelecer uma conexão com o cache", async () => {
      expect(mockCacheConnect).toHaveBeenCalledTimes(1);
    });

    it("deve iniciar o App na porta do config", async () => {
      expect(App).toHaveBeenCalledTimes(1);
      expect(mockAppStart).toHaveBeenCalledWith(config.PORT);
    });
  });

  describe("[FUNCTION] bootstrap.catch", () => {
    let originalExit: typeof process.exit;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      originalExit = process.exit;
      // @ts-expect-error override for test
      process.exit = jest.fn();
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      process.exit = originalExit;
      consoleErrorSpy.mockRestore();
      jest.resetModules();
    });

    it("deve chamar process.exit(1) quando o bootstrap falhar", async () => {
      mockDbConnect.mockRejectedValueOnce(new Error("db down"));

      await new Promise<void>((resolve) => {
        jest.isolateModules(() => {
          require("./server");
        });
        setImmediate(() => resolve());
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Failed to bootstrap application:",
        expect.any(Error),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
