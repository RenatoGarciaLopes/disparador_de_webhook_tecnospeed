import { jest } from "@jest/globals";

const mockSequelize = {
  authenticate: jest.fn(),
  sync: jest.fn(),
};

jest.mock("@/sequelize", () => ({
  sequelize: mockSequelize,
}));

import { DatabaseService } from "./database.service";

describe("[INFRA] DatabaseService", () => {
  let consoleLogSpy: jest.SpiedFunction<jest.Mock>;
  let consoleErrorSpy: jest.SpiedFunction<jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("[CONNECT] connect()", () => {
    it("deve retornar true quando authenticate e sync forem bem-sucedidos", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      mockSequelize.sync.mockResolvedValue(undefined as never);

      const result = await service.connect();

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[debug] Conexão estabelecida com sucesso",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[debug] Sincronização do banco de dados realizada com sucesso",
      );
    });

    it("deve retornar false quando authenticate falhar", async () => {
      const service = new DatabaseService();
      const authError = new Error("Authentication failed");
      mockSequelize.authenticate.mockRejectedValue(authError as never);

      const result = await service.connect();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Erro ao conectar ao banco de dados:",
        authError,
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[debug] Conexão estabelecida com sucesso",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Erro ao sincronizar o banco de dados:",
        syncError,
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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Erro ao conectar ao banco de dados:",
        error,
      );
    });

    it("deve logar erro de sync com mensagem correta", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      const error = new Error("Database sync failed");
      mockSequelize.sync.mockRejectedValue(error as never);

      await service.connect();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Erro ao sincronizar o banco de dados:",
        error,
      );
    });
  });

  describe("[SUCCESS FLOW] fluxo de sucesso", () => {
    it("deve logar mensagens de sucesso na ordem correta", async () => {
      const service = new DatabaseService();
      mockSequelize.authenticate.mockResolvedValue(undefined as never);
      mockSequelize.sync.mockResolvedValue(undefined as never);

      await service.connect();

      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        1,
        "[debug] Conexão estabelecida com sucesso",
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        2,
        "[debug] Sincronização do banco de dados realizada com sucesso",
      );
    });
  });
});
