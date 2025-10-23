import { envSchema } from "./schema";

jest.mock("zod", () => {
  const actualZod = jest.requireActual("zod");
  return {
    ...actualZod,
    z: {
      ...actualZod.z,
      config: jest.fn(),
      locales: {
        pt: jest.fn(),
      },
    },
  };
});

describe("[CHORE] config/index.ts", () => {
  beforeEach(() => {
    process.exit = jest.fn() as any;
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("[SCHEMA] envSchema", () => {
    it("deve validar todas as variáveis de ambiente obrigatórias", () => {
      const validEnv = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECNOSPEED_BASE_URL: "https://api.tecnospeed.com",
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
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
        TECNOSPEED_BASE_URL: "https://api.tecnospeed.com",
      });
    });

    it("deve transformar PORT de string para number", () => {
      const env = { PORT: "8080" };
      const result = envSchema.partial().safeParse(env);
      expect(result.success).toBe(true);
      expect(result.data?.PORT).toBe(8080);
    });

    it("deve transformar DB_PORT de string para number", () => {
      const env = { DB_PORT: "3306" };
      const result = envSchema.partial().safeParse(env);
      expect(result.success).toBe(true);
      expect(result.data?.DB_PORT).toBe(3306);
    });

    it("deve transformar REDIS_PORT de string para number", () => {
      const env = { REDIS_PORT: "6379" };
      const result = envSchema.partial().safeParse(env);
      expect(result.success).toBe(true);
      expect(result.data?.REDIS_PORT).toBe(6379);
    });
  });

  describe("[VALIDATION] mínimo 3 caracteres", () => {
    it("deve falhar quando NODE_ENV tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "te",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBeDefined();
    });

    it("deve falhar quando DB_USERNAME tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "us",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando DB_PASSWORD tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "pa",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando DB_DATABASE tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "db",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando DB_HOST tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "lo",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando REDIS_PASSWORD tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "re",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando REDIS_HOST tem menos de 3 caracteres", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "lo",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("[VALIDATION] strings com exatamente 3 caracteres", () => {
    it("deve aceitar strings com exatamente 3 caracteres", () => {
      const env = {
        NODE_ENV: "dev",
        PORT: "3000",
        DB_USERNAME: "usr",
        DB_PASSWORD: "pwd",
        DB_DATABASE: "db1",
        DB_HOST: "loc",
        DB_PORT: "5432",
        REDIS_PASSWORD: "pwd",
        REDIS_PORT: "6379",
        REDIS_HOST: "loc",
        TECNOSPEED_BASE_URL: "https://api.tecnospeed.com",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
    });
  });

  describe("[VALIDATION] variáveis obrigatórias", () => {
    it("deve falhar quando NODE_ENV está ausente", () => {
      const env = {
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando PORT está ausente", () => {
      const env = {
        NODE_ENV: "test",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando variáveis do banco estão ausentes", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando variáveis do Redis estão ausentes", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("[TRANSFORMATION] conversão de tipos", () => {
    it("deve falhar quando PORT não é um número válido", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "abc",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando DB_PORT não é um número válido", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "xyz",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("deve falhar quando REDIS_PORT não é um número válido", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "def",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("[CONFIGURATION] zod locale", () => {
    it("deve configurar locale português para mensagens de erro", () => {
      const env = {
        NODE_ENV: "test",
        PORT: "abc",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);

      expect(result.success).toBe(false);

      expect(result.error?.issues[0]?.message).toBeDefined();
    });

    it("deve mostrar mensagem de erro para string muito curta", () => {
      const env = {
        NODE_ENV: "te",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);

      expect(result.success).toBe(false);

      expect(result.error?.issues[0]?.message).toBeDefined();
    });

    it("deve mostrar mensagem de erro para campo obrigatório ausente", () => {
      const env = {
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };
      const result = envSchema.safeParse(env);

      expect(result.success).toBe(false);

      expect(result.error?.issues[0]?.message).toBeDefined();
    });
  });

  describe("[BEHAVIOR] config module", () => {
    it("deve exportar config quando todas as variáveis são válidas", () => {
      process.env = {
        NODE_ENV: "test",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      const configModule = require("../config");

      expect(configModule.config).toBeDefined();
      expect(configModule.config.PORT).toBe(3000);
      expect(configModule.config.DB_PORT).toBe(5432);
      expect(configModule.config.REDIS_PORT).toBe(6379);
    });

    it("deve chamar process.exit(1) quando variáveis são inválidas", () => {
      process.env = {
        NODE_ENV: "test",

        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      require("../config");

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error).toHaveBeenCalledWith(
        "Variáveis de ambiente inválidas:",
        expect.any(String),
      );
    });

    it("deve logar erro formatado quando validação falha", () => {
      process.env = {
        NODE_ENV: "test",
        PORT: "invalid_port",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      require("../config");

      expect(console.error).toHaveBeenCalledWith(
        "Variáveis de ambiente inválidas:",
        expect.any(String),
      );
    });
  });

  describe("[BEHAVIOR] prettifyError", () => {
    it("deve usar z.prettifyError para formatar erro de validação", () => {
      process.env = {
        NODE_ENV: "t",
        PORT: "000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      require("../config");

      expect(console.error).toHaveBeenCalledWith(
        "Variáveis de ambiente inválidas:",
        expect.any(String),
      );
    });

    it("deve chamar console.error com mensagem formatada quando validação falha", () => {
      process.env = {
        NODE_ENV: "test",
        PORT: "invalid_port",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
      };

      require("../config");

      expect(console.error).toHaveBeenCalledWith(
        "Variáveis de ambiente inválidas:",
        expect.any(String),
      );
    });

    it("deve formatar múltiplos erros quando várias validações falham", () => {
      process.env = {
        NODE_ENV: "t",
        PORT: "invalid",
        DB_USERNAME: "u",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      require("../config");

      expect(console.error).toHaveBeenCalledWith(
        "Variáveis de ambiente inválidas:",
        expect.any(String),
      );
    });
  });

  describe("[INTEGRATION] zod configuration and error handling", () => {
    it("deve configurar locale português antes de validar", () => {
      const env = {
        NODE_ENV: "t",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };
      const result = envSchema.safeParse(env);

      expect(result.success).toBe(false);

      expect(result.error?.issues[0]?.message).toBeDefined();
    });

    it("deve manter configuração do locale entre validações", () => {
      const env1 = {
        NODE_ENV: "t",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };
      const env2 = {
        NODE_ENV: "test",
        PORT: "abc",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      const result1 = envSchema.safeParse(env1);
      const result2 = envSchema.safeParse(env2);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);

      expect(result1.error?.issues[0]?.message).toBeDefined();
      expect(result2.error?.issues[0]?.message).toBeDefined();
    });
  });

  describe("[EDGE CASES] boundary values", () => {
    it("deve aceitar PORT como 0", () => {
      const env = { PORT: "0" };
      const result = envSchema.partial().safeParse(env);
      expect(result.success).toBe(true);
      expect(result.data?.PORT).toBe(0);
    });

    it("deve aceitar PORT como número máximo", () => {
      const env = { PORT: "65535" };
      const result = envSchema.partial().safeParse(env);
      expect(result.success).toBe(true);
      expect(result.data?.PORT).toBe(65535);
    });

    it("NÃO deve aceitar strings vazias", () => {
      const env = {
        NODE_ENV: "",
        PORT: "3000",
        DB_USERNAME: "user",
        DB_PASSWORD: "password",
        DB_DATABASE: "database",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        REDIS_PASSWORD: "redis_password",
        REDIS_PORT: "6379",
        REDIS_HOST: "localhost",
        TECHNOSPEED_BASE_URL: "https://api.tecnospeed.com.br",
      };

      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });
});
