import { jest } from "@jest/globals";

const mockSequelize = {
  authenticate: jest.fn(),
  sync: jest.fn(),
};

jest.mock("@/sequelize", () => ({
  sequelize: mockSequelize,
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
import { DatabaseService } from "./database.service";

describe("[INFRA] DatabaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("[CONNECT] connect()", () => {
    it("deve retornar true quando authenticate e sync forem bem-sucedidos", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      mockSequelize.sync.mockResolvedValue(undefined as never);

      const result = await service.connect();

      expect(result).toBe(true);
      expect(Logger.info).toHaveBeenCalledWith(
        "Attempting to authenticate database connection",
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "Database authentication successful",
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "Attempting to sync database models",
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "Database models synchronized successfully",
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "Database connection established and synchronized",
      );
    });

    it("deve retornar false quando authenticate falhar", async () => {
      const service = new DatabaseService();
      const authError = new Error("Authentication failed");
      mockSequelize.authenticate.mockRejectedValue(authError as never);

      const result = await service.connect();

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(
        "Database authentication failed: Authentication failed",
      );
      expect(mockSequelize.sync).not.toHaveBeenCalled();
    });

    it("deve retornar false quando sync falhar", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      const syncError = new Error("Sync failed");
      mockSequelize.sync.mockRejectedValue(syncError as never);

      const result = await service.connect();

      expect(result).toBe(false);
      expect(Logger.info).toHaveBeenCalledWith(
        "Database authentication successful",
      );
      expect(Logger.error).toHaveBeenCalledWith(
        "Database synchronization failed: Sync failed",
      );
    });

    it("deve chamar authenticate antes de sync", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      mockSequelize.sync.mockResolvedValue(undefined as never);

      await service.connect();

      expect(mockSequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(mockSequelize.sync).toHaveBeenCalledTimes(1);
      expect(mockSequelize.authenticate).toHaveBeenCalled();
      expect(mockSequelize.sync).toHaveBeenCalled();
    });

    it("não deve chamar sync quando authenticate falhar", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockRejectedValue(
        new Error("Auth failed") as never,
      );

      await service.connect();

      expect(mockSequelize.sync).not.toHaveBeenCalled();
    });
  });

  describe("[ERROR HANDLING] tratamento de erros", () => {
    it("deve logar erro de authenticate com mensagem correta", async () => {
      const service = new DatabaseService();
      const error = new Error("Database connection failed");
      mockSequelize.authenticate.mockRejectedValue(error as never);

      await service.connect();

      expect(Logger.error).toHaveBeenCalledWith(
        "Database authentication failed: Database connection failed",
      );

      // Testa quando erro não é instância de Error
      jest.clearAllMocks();
      const nonErrorValue = "String authentication error" as any;
      mockSequelize.authenticate.mockRejectedValue(nonErrorValue as never);

      await service.connect();

      expect(Logger.error).toHaveBeenCalledWith(
        `Database authentication failed: ${String(nonErrorValue)}`,
      );
    });

    it("deve logar erro de sync com mensagem correta", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      const error = new Error("Database sync failed");
      mockSequelize.sync.mockRejectedValue(error as never);

      await service.connect();

      expect(Logger.error).toHaveBeenCalledWith(
        "Database synchronization failed: Database sync failed",
      );

      // Testa quando erro não é instância de Error
      jest.clearAllMocks();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      const nonErrorObject = {
        code: "SYNC_ERROR",
        message: "Sync failed",
      } as any;
      mockSequelize.sync.mockRejectedValue(nonErrorObject as never);

      await service.connect();

      expect(Logger.error).toHaveBeenCalledWith(
        `Database synchronization failed: ${String(nonErrorObject)}`,
      );
    });
  });

  describe("[SUCCESS FLOW] fluxo de sucesso", () => {
    it("deve logar mensagens de sucesso na ordem correta", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      mockSequelize.sync.mockResolvedValue(undefined as never);

      await service.connect();

      expect(Logger.info).toHaveBeenNthCalledWith(
        1,
        "Attempting to authenticate database connection",
      );
      expect(Logger.info).toHaveBeenNthCalledWith(
        2,
        "Database authentication successful",
      );
    });
  });
});
