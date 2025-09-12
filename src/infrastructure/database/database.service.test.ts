import { sequelize } from "@/sequelize";
import { DatabaseService } from "./database.service";

jest.mock("@/sequelize", () => ({
  sequelize: {
    authenticate: jest.fn(() => Promise.resolve()),
    sync: jest.fn(() => Promise.resolve()),
  },
}));

describe("DatabaseService", () => {
  let databaseService: DatabaseService;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    databaseService = new DatabaseService();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call sequelize.authenticate() and sequelize.sync()", async () => {
    await databaseService.connect();

    // Verificação (Asserts):
    expect(sequelize.authenticate).toHaveBeenCalledTimes(1);

    expect(sequelize.sync).toHaveBeenCalledTimes(1);
  });

  it("should handle authentication errors", async () => {
    (sequelize.authenticate as jest.Mock).mockRejectedValueOnce(
      new Error("Auth Error"),
    );

    await databaseService.connect();

    // Verificação:
    expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
    expect(sequelize.sync).not.toHaveBeenCalled();
  });

  it("should handle sync errors", async () => {
    // Configura o mock para autenticar com sucesso mas falhar na sincronização.
    (sequelize.sync as jest.Mock).mockRejectedValueOnce(
      new Error("Sync Error"),
    );

    // Ação: chama o método connect.
    await databaseService.connect();

    // Verificação:
    // Garante que o sync foi chamado, mesmo com erro.
    expect(sequelize.sync).toHaveBeenCalledTimes(1);
  });
});
