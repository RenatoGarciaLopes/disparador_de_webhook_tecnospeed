import { ErrorResponse } from "./ErrorResponse";
import { UnauthorizedError } from "./Unauthorized";

describe("UnauthorizedError", () => {
  describe("Construtor", () => {
    it("deve criar uma instância com código padrão 'UNAUTHORIZED'", () => {
      const errorMessage = "Não autorizado";
      const error = new UnauthorizedError(errorMessage);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.errors).toBe(errorMessage);
    });

    it("deve criar uma instância com código customizado", () => {
      const errorMessage = "Token inválido";
      const customCode = "INVALID_TOKEN";
      const error = new UnauthorizedError(errorMessage, customCode);

      expect(error.code).toBe(customCode);
      expect(error.errors).toBe(errorMessage);
    });

    it("deve estender ErrorResponse", () => {
      const error = new UnauthorizedError("Teste");
      expect(error).toBeInstanceOf(ErrorResponse);
    });

    it("deve ter statusCode 401", () => {
      const error = new UnauthorizedError("Teste");
      expect(error.statusCode).toBe(401);
    });

    it("deve aceitar mensagens de erro diferentes", () => {
      const mensagens = [
        "Token expirado",
        "Credenciais inválidas",
        "Acesso negado",
        "Software House não encontrada",
        "Cedente inativo",
      ];

      mensagens.forEach((mensagem) => {
        const error = new UnauthorizedError(mensagem);
        expect(error.errors).toBe(mensagem);
        expect(error.statusCode).toBe(401);
      });
    });

    it("deve aceitar string vazia como mensagem", () => {
      const error = new UnauthorizedError("");
      expect(error.errors).toBe("");
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("deve manter mensagem genérica", () => {
      const error = new UnauthorizedError("Não autorizado");
      expect(error.errors).toBe("Não autorizado");
    });
  });

  describe("Propriedades da Classe", () => {
    it("deve ter propriedade errors pública acessível", () => {
      const errorMessage = "Acesso negado";
      const error = new UnauthorizedError(errorMessage);

      expect(error.errors).toBeDefined();
      expect(error.errors).toBe(errorMessage);
      expect(typeof error.errors).toBe("string");
    });

    it("deve ter propriedade code pública acessível", () => {
      const error = new UnauthorizedError("Teste");

      expect(error.code).toBeDefined();
      expect(typeof error.code).toBe("string");
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("deve ter propriedade statusCode herdada de ErrorResponse", () => {
      const error = new UnauthorizedError("Teste");

      expect(error.statusCode).toBeDefined();
      expect(error.statusCode).toBe(401);
      expect(typeof error.statusCode).toBe("number");
    });

    it("deve permitir modificação da propriedade errors", () => {
      const error = new UnauthorizedError("Original");
      error.errors = "Modificado";

      expect(error.errors).toBe("Modificado");
    });

    it("deve permitir modificação da propriedade code", () => {
      const error = new UnauthorizedError("Teste");
      error.code = "NEW_UNAUTHORIZED_CODE";

      expect(error.code).toBe("NEW_UNAUTHORIZED_CODE");
    });
  });

  describe("Método json()", () => {
    it("deve retornar o objeto JSON com code, statusCode e error", () => {
      const errorMessage = "Token inválido";
      const error = new UnauthorizedError(errorMessage);

      const json = error.json();

      expect(json).toEqual({
        code: "UNAUTHORIZED",
        statusCode: 401,
        error: errorMessage,
      });
    });

    it("deve retornar statusCode 401 no JSON", () => {
      const error = new UnauthorizedError("Teste");
      const json = error.json();

      expect(json.statusCode).toBe(401);
      expect(json).toHaveProperty("statusCode", 401);
    });

    it("deve incluir a mensagem de erro no JSON", () => {
      const errorMessage = "Credenciais inválidas";
      const error = new UnauthorizedError(errorMessage);
      const json = error.json();

      expect(json.error).toBe(errorMessage);
    });

    it("deve manter código customizado no JSON", () => {
      const customCode = "EXPIRED_TOKEN";
      const error = new UnauthorizedError("Token expirado", customCode);
      const json = error.json();

      expect(json.code).toBe(customCode);
    });

    it("deve retornar estrutura consistente independente da mensagem", () => {
      const error1 = new UnauthorizedError("Mensagem 1");
      const error2 = new UnauthorizedError("Mensagem 2");

      const json1 = error1.json();
      const json2 = error2.json();

      expect(Object.keys(json1).sort()).toEqual(Object.keys(json2).sort());
      expect(json1).toHaveProperty("code");
      expect(json1).toHaveProperty("statusCode");
      expect(json1).toHaveProperty("error");
    });

    it("deve preservar string vazia no JSON", () => {
      const error = new UnauthorizedError("");
      const json = error.json();

      expect(json.error).toBe("");
    });
  });

  describe("Integração com ErrorResponse", () => {
    it("deve chamar o construtor de ErrorResponse com parâmetros corretos", () => {
      const errorMessage = "Teste de integração";
      const error = new UnauthorizedError(errorMessage);

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
      expect(error.error).toBe(errorMessage);
    });

    it("deve herdar método json() de ErrorResponse", () => {
      const error = new UnauthorizedError("Teste");

      expect(typeof error.json).toBe("function");
      expect(error.json).toBeDefined();
    });

    it("deve ter as mesmas propriedades de ErrorResponse", () => {
      const error = new UnauthorizedError("Teste");

      expect(error).toHaveProperty("code");
      expect(error).toHaveProperty("statusCode");
      expect(error).toHaveProperty("error");
      expect(error).toHaveProperty("json");
    });
  });

  describe("Casos de uso comuns", () => {
    it("deve criar erro para Software House não encontrada", () => {
      const error = new UnauthorizedError("Software House não encontrada");

      expect(error.errors).toBe("Software House não encontrada");
      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro para Cedente não encontrado", () => {
      const error = new UnauthorizedError("Cedente não encontrado");

      expect(error.errors).toBe("Cedente não encontrado");
      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro para credenciais inválidas", () => {
      const error = new UnauthorizedError(
        "CNPJ ou TOKEN inválidos",
        "INVALID_CREDENTIALS",
      );

      expect(error.errors).toBe("CNPJ ou TOKEN inválidos");
      expect(error.code).toBe("INVALID_CREDENTIALS");
      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro para entidade inativa", () => {
      const error = new UnauthorizedError("Software House inativa");

      expect(error.errors).toBe("Software House inativa");
      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro para token expirado", () => {
      const error = new UnauthorizedError("Token expirado", "TOKEN_EXPIRED");

      expect(error.code).toBe("TOKEN_EXPIRED");
      expect(error.errors).toBe("Token expirado");
    });
  });

  describe("Comparação com outras classes de erro", () => {
    it("deve ter statusCode diferente de ErrorResponse genérico", () => {
      const unauthorized = new UnauthorizedError("Teste");
      const generic = new ErrorResponse("GENERIC", 500, "Erro genérico");

      expect(unauthorized.statusCode).toBe(401);
      expect(generic.statusCode).toBe(500);
      expect(unauthorized.statusCode).not.toBe(generic.statusCode);
    });

    it("deve ter estrutura similar a InvalidFieldsError mas com tipo diferente", () => {
      const unauthorized = new UnauthorizedError("Não autorizado");

      expect(unauthorized).toHaveProperty("code");
      expect(unauthorized).toHaveProperty("statusCode");
      expect(unauthorized).toHaveProperty("error");
      expect(unauthorized.statusCode).toBe(401); // vs 400 de InvalidFieldsError
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com mensagens longas", () => {
      const longMessage = "A".repeat(1000);
      const error = new UnauthorizedError(longMessage);

      expect(error.errors).toBe(longMessage);
      expect(error.errors.length).toBe(1000);
    });

    it("deve lidar com caracteres especiais na mensagem", () => {
      const specialMessage = "Erro: @#$%^&*()_+-=[]{}|;':\",./<>?";
      const error = new UnauthorizedError(specialMessage);

      expect(error.errors).toBe(specialMessage);
    });

    it("deve lidar com quebras de linha na mensagem", () => {
      const multilineMessage =
        "Erro na linha 1\nErro na linha 2\nErro na linha 3";
      const error = new UnauthorizedError(multilineMessage);

      expect(error.errors).toBe(multilineMessage);
      expect(error.errors).toContain("\n");
    });

    it("deve lidar com códigos customizados muito longos", () => {
      const longCode = "VERY_LONG_CUSTOM_ERROR_CODE_".repeat(10);
      const error = new UnauthorizedError("Teste", longCode);

      expect(error.code).toBe(longCode);
    });
  });

  describe("Imutabilidade e consistência", () => {
    it("deve manter os mesmos valores após criação", () => {
      const errorMessage = "Teste de consistência";
      const customCode = "CUSTOM_CODE";
      const error = new UnauthorizedError(errorMessage, customCode);

      const json1 = error.json();
      const json2 = error.json();

      expect(json1).toEqual(json2);
    });

    it("deve criar instâncias independentes", () => {
      const error1 = new UnauthorizedError("Erro 1");
      const error2 = new UnauthorizedError("Erro 2");

      expect(error1.errors).not.toBe(error2.errors);
      expect(error1).not.toBe(error2);
    });

    it("deve preservar tipo string para errors mesmo após modificação", () => {
      const error = new UnauthorizedError("Original");
      error.errors = "Modificado";

      expect(typeof error.errors).toBe("string");
    });
  });
});
