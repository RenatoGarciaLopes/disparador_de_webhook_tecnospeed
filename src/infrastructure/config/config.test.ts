describe("Configuração de ambiente", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // reinicia cache de require/import
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV; // restaura
  });

  it("deve parsear corretamente variáveis válidas", () => {
    process.env = {
      NODE_ENV: "development",
      PORT: "3000",
      DB_USERNAME: "user",
      DB_PASSWORD: "pass",
      DB_DATABASE: "db",
      DB_HOST: "localhost",
      DB_PORT: "5432",
    };

    const { config } = require("../config"); // importa depois de setar env

    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(3000); // transformado para number
    expect(config.DB_PORT).toBe(5432); // transformado para number
  });

  it("deve chamar console.error e process.exit se variáveis inválidas", () => {
    process.env = {
      NODE_ENV: "development",
      PORT: "abc", // inválido
    };

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(((
      code?: number,
    ) => {
      throw new Error(`process.exit: ${code}`);
    }) as any);

    expect(() => require("../config")).toThrow("process.exit: 1");

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
