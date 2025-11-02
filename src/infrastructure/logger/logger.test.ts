describe("[INFRA] Logger - isDev validation", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let mockPino: jest.Mock;

  beforeEach(() => {
    mockPino = jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    }));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("deve configurar logger como dev quando NODE_ENV é 'development'", () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();

    jest.mock("pino", () => mockPino);

    require("./logger");

    expect(mockPino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
        transport: expect.objectContaining({
          target: "pino-pretty",
          options: expect.objectContaining({
            colorize: true,
          }),
        }),
      }),
    );
  });

  it("deve configurar logger como production quando NODE_ENV é 'production'", () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();

    jest.mock("pino", () => mockPino);

    require("./logger");

    expect(mockPino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        transport: undefined,
      }),
    );
  });

  it("deve configurar logger como dev quando NODE_ENV não está definido (default)", () => {
    delete process.env.NODE_ENV;
    jest.resetModules();

    jest.mock("pino", () => mockPino);

    require("./logger");

    expect(mockPino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
        transport: expect.objectContaining({
          target: "pino-pretty",
        }),
      }),
    );
  });
});
