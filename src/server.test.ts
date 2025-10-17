// --- Mocks ---
// IMPORTANTE: Mocks precisam ser definidos ANTES de importar qualquer módulo
const mockConnect = jest.fn();
const mockStart = jest.fn();

jest.mock("./app", () => ({
  App: jest.fn().mockImplementation(function (this: any) {
    this.start = mockStart;
    return this;
  }),
}));

jest.mock("./infrastructure/database/database.service", () => ({
  DatabaseService: jest.fn().mockImplementation(function (this: any) {
    this.connect = mockConnect;
    return this;
  }),
}));

jest.mock("./infrastructure/config", () => ({
  config: { PORT: 3000, NODE_ENV: "test" },
}));

import { App } from "./app";
import { config } from "./infrastructure/config";
import { DatabaseService } from "./infrastructure/database/database.service";

describe("Server Bootstrap", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    // Reset para comportamento padrão bem-sucedido
    mockConnect.mockResolvedValue(true);
    mockStart.mockReturnValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.resetModules();
  });

  describe("Inicialização bem-sucedida", () => {
    it("deve conectar ao banco de dados e iniciar o servidor na porta configurada", async () => {
      mockConnect.mockResolvedValue(true);

      // Importa e executa o server.ts
      require("./server");

      // Aguarda um tick para garantir que a promise do bootstrap foi resolvida
      await new Promise((resolve) => setImmediate(resolve));

      expect(DatabaseService).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(App).toHaveBeenCalledTimes(1);
      expect(mockStart).toHaveBeenCalledWith(config.PORT);
      expect(mockStart).toHaveBeenCalledWith(3000);
    });

    it("deve executar DatabaseService.connect antes de App.start", async () => {
      const callOrder: string[] = [];

      mockConnect.mockImplementation(async () => {
        callOrder.push("connect");
        return true;
      });

      mockStart.mockImplementation(() => {
        callOrder.push("start");
      });

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(callOrder).toEqual(["connect", "start"]);
    });

    it("deve chamar connect após instanciar DatabaseService", async () => {
      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tratamento de erros", () => {
    it("deve capturar erro na conexão com banco e chamar process.exit(1)", async () => {
      const dbError = new Error("Falha na conexão com o banco");
      mockConnect.mockRejectedValue(dbError);

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Failed to bootstrap application:",
        dbError,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("deve executar o bloco catch quando ocorrer qualquer erro", async () => {
      const error = new Error("Qualquer erro durante bootstrap");
      mockConnect.mockRejectedValue(error);

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("deve capturar erro ao iniciar servidor e chamar process.exit(1)", async () => {
      const startError = new Error("Falha ao iniciar servidor");
      mockStart.mockImplementationOnce(() => {
        throw startError;
      });

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Failed to bootstrap application:",
        startError,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("deve chamar process.exit(1) quando connect falhar", async () => {
      mockConnect.mockRejectedValue(new Error("DB connection failed"));

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("deve logar a mensagem de erro completa com erro específico", async () => {
      const specificError = new Error("Erro específico de teste");
      mockConnect.mockRejectedValue(specificError);

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[error] Failed to bootstrap application:",
        specificError,
      );
    });
  });

  describe("Ordem de execução", () => {
    it("deve chamar connect e start na ordem correta", async () => {
      const callOrder: string[] = [];

      mockConnect.mockImplementation(async () => {
        callOrder.push("connect");
        return true;
      });

      mockStart.mockImplementation(() => {
        callOrder.push("start");
      });

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(callOrder).toEqual(["connect", "start"]);
    });
  });

  describe("Configuração", () => {
    it("deve usar config.PORT ao iniciar o servidor", async () => {
      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockStart).toHaveBeenCalledWith(config.PORT);
      expect(mockStart).toHaveBeenCalledWith(3000);
    });
  });

  describe("Cobertura completa do bloco catch", () => {
    it("deve tratar erro genérico e chamar process.exit com código 1", async () => {
      const genericError = new Error("Erro genérico");
      mockConnect.mockRejectedValue(genericError);

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(processExitSpy).toHaveBeenCalledTimes(1);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("deve logar erro e process.exit quando bootstrap falhar", async () => {
      const error = new Error("Teste de log");
      mockConnect.mockRejectedValue(error);

      require("./server");
      await new Promise((resolve) => setImmediate(resolve));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalled();
    });
  });
});
