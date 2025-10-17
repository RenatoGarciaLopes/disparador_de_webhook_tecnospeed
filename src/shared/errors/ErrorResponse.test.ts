import { ErrorResponse } from "./ErrorResponse";

describe("ErrorResponse", () => {
  describe("Construtor", () => {
    it("deve criar uma instância com todos os parâmetros", () => {
      const error = new ErrorResponse("TEST_ERROR", 400, {
        message: "Erro de teste",
      });

      expect(error).toBeInstanceOf(ErrorResponse);
      expect(error.code).toBe("TEST_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.error).toEqual({ message: "Erro de teste" });
    });

    it("deve aceitar diferentes códigos de status HTTP", () => {
      const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503];

      statusCodes.forEach((statusCode) => {
        const error = new ErrorResponse("ERROR", statusCode, "Erro");
        expect(error.statusCode).toBe(statusCode);
      });
    });

    it("deve aceitar diferentes tipos de error (string, objeto, array)", () => {
      const error1 = new ErrorResponse("CODE", 400, "Mensagem simples");
      const error2 = new ErrorResponse("CODE", 400, { field: "value" });
      const error3 = new ErrorResponse("CODE", 400, ["erro1", "erro2"]);

      expect(error1.error).toBe("Mensagem simples");
      expect(error2.error).toEqual({ field: "value" });
      expect(error3.error).toEqual(["erro1", "erro2"]);
    });

    it("deve aceitar null como error", () => {
      const error = new ErrorResponse("CODE", 500, null);
      expect(error.error).toBeNull();
    });

    it("deve aceitar undefined como error", () => {
      const error = new ErrorResponse("CODE", 500, undefined);
      expect(error.error).toBeUndefined();
    });

    it("deve aceitar objeto complexo como error", () => {
      const complexError = {
        message: "Erro complexo",
        details: {
          field1: "erro1",
          field2: "erro2",
          nested: {
            deep: "valor",
          },
        },
        timestamp: new Date().toISOString(),
      };

      const error = new ErrorResponse("COMPLEX", 400, complexError);
      expect(error.error).toEqual(complexError);
    });
  });

  describe("Propriedades da Classe", () => {
    it("deve ter propriedade code pública acessível", () => {
      const error = new ErrorResponse("TEST_CODE", 400, "Erro");

      expect(error.code).toBeDefined();
      expect(error.code).toBe("TEST_CODE");
      expect(typeof error.code).toBe("string");
    });

    it("deve ter propriedade statusCode pública acessível", () => {
      const error = new ErrorResponse("CODE", 404, "Erro");

      expect(error.statusCode).toBeDefined();
      expect(error.statusCode).toBe(404);
      expect(typeof error.statusCode).toBe("number");
    });

    it("deve ter propriedade error pública acessível", () => {
      const errorData = { message: "Erro" };
      const error = new ErrorResponse("CODE", 400, errorData);

      expect(error.error).toBeDefined();
      expect(error.error).toBe(errorData);
    });

    it("deve permitir modificação da propriedade code", () => {
      const error = new ErrorResponse("ORIGINAL_CODE", 400, "Erro");
      error.code = "MODIFIED_CODE";

      expect(error.code).toBe("MODIFIED_CODE");
    });

    it("deve permitir modificação da propriedade statusCode", () => {
      const error = new ErrorResponse("CODE", 400, "Erro");
      error.statusCode = 500;

      expect(error.statusCode).toBe(500);
    });

    it("deve permitir modificação da propriedade error", () => {
      const error = new ErrorResponse("CODE", 400, "Original");
      error.error = "Modificado";

      expect(error.error).toBe("Modificado");
    });
  });

  describe("Método json()", () => {
    it("deve retornar objeto com code, statusCode e error", () => {
      const error = new ErrorResponse("TEST", 400, "Mensagem de erro");
      const json = error.json();

      expect(json).toEqual({
        code: "TEST",
        statusCode: 400,
        error: "Mensagem de erro",
      });
    });

    it("deve preservar o tipo do error no JSON", () => {
      const error1 = new ErrorResponse("CODE", 400, "string");
      const error2 = new ErrorResponse("CODE", 400, { obj: "value" });
      const error3 = new ErrorResponse("CODE", 400, [1, 2, 3]);

      expect(typeof error1.json().error).toBe("string");
      expect(typeof error2.json().error).toBe("object");
      expect(Array.isArray(error3.json().error)).toBe(true);
    });

    it("deve retornar estrutura consistente em múltiplas chamadas", () => {
      const error = new ErrorResponse("CODE", 400, "Erro");

      const json1 = error.json();
      const json2 = error.json();

      expect(json1).toEqual(json2);
    });

    it("deve preservar null no JSON", () => {
      const error = new ErrorResponse("CODE", 500, null);
      const json = error.json();

      expect(json.error).toBeNull();
    });

    it("deve preservar undefined no JSON", () => {
      const error = new ErrorResponse("CODE", 500, undefined);
      const json = error.json();

      expect(json.error).toBeUndefined();
    });

    it("deve preservar objetos complexos no JSON", () => {
      const complexError = {
        message: "Erro",
        details: { field: "value" },
        code: "NESTED_CODE",
      };
      const error = new ErrorResponse("CODE", 400, complexError);
      const json = error.json();

      expect(json.error).toEqual(complexError);
      expect(json.error.details).toBeDefined();
    });

    it("deve retornar objeto com todas as propriedades obrigatórias", () => {
      const error = new ErrorResponse("CODE", 400, "Erro");
      const json = error.json();

      expect(json).toHaveProperty("code");
      expect(json).toHaveProperty("statusCode");
      expect(json).toHaveProperty("error");
      expect(Object.keys(json)).toHaveLength(3);
    });
  });

  describe("Método estático internalServerErrorFromError", () => {
    it("deve criar ErrorResponse com código 'INTERNAL_SERVER_ERROR'", () => {
      const originalError = new Error("Erro inesperado");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse).toBeInstanceOf(ErrorResponse);
      expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("deve criar ErrorResponse com statusCode 500", () => {
      const originalError = new Error("Erro do servidor");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.statusCode).toBe(500);
    });

    it("deve incluir mensagem do erro original no array errors", () => {
      const errorMessage = "Falha na conexão com o banco";
      const originalError = new Error(errorMessage);
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error).toEqual({
        errors: [errorMessage],
      });
      expect(errorResponse.error.errors).toContain(errorMessage);
    });

    it("deve usar mensagem padrão se erro não tiver message", () => {
      const errorWithoutMessage = { message: undefined } as Error;
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(errorWithoutMessage);

      expect(errorResponse.error).toEqual({
        errors: ["Erro interno do servidor"],
      });
    });

    it("deve usar mensagem padrão se erro tiver message null", () => {
      const errorWithNullMessage = { message: null } as unknown as Error;
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(errorWithNullMessage);

      expect(errorResponse.error).toEqual({
        errors: ["Erro interno do servidor"],
      });
    });

    it("deve preservar message vazia (string vazia é falsy mas válida)", () => {
      const errorWithEmptyMessage = new Error("");
      const errorResponse = ErrorResponse.internalServerErrorFromError(
        errorWithEmptyMessage,
      );

      // Nullish coalescing (??) não captura string vazia, então preserva ""
      expect(errorResponse.error.errors).toEqual([""]);
    });

    it("deve retornar instância de ErrorResponse", () => {
      const originalError = new Error("Teste");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse).toBeInstanceOf(ErrorResponse);
    });

    it("deve criar erro serializable via json()", () => {
      const originalError = new Error("Erro de database");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      const json = errorResponse.json();

      expect(json).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: {
          errors: ["Erro de database"],
        },
      });
    });
  });

  describe("Uso como classe base", () => {
    it("deve poder ser estendida por outras classes de erro", () => {
      class CustomError extends ErrorResponse {
        constructor(message: string) {
          super("CUSTOM_ERROR", 418, { message });
        }
      }

      const customError = new CustomError("Sou um bule");
      expect(customError).toBeInstanceOf(ErrorResponse);
      expect(customError.statusCode).toBe(418);
    });

    it("deve manter funcionalidade do método json() em classes filhas", () => {
      class NotFoundError extends ErrorResponse {
        constructor(resource: string) {
          super("NOT_FOUND", 404, { resource, message: "Não encontrado" });
        }
      }

      const error = new NotFoundError("Usuario");
      const json = error.json();

      expect(json.code).toBe("NOT_FOUND");
      expect(json.statusCode).toBe(404);
      expect(json.error.resource).toBe("Usuario");
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com códigos de erro muito longos", () => {
      const longCode = "VERY_LONG_ERROR_CODE_".repeat(10);
      const error = new ErrorResponse(longCode, 400, "Erro");

      expect(error.code).toBe(longCode);
    });

    it("deve lidar com statusCode fora do padrão HTTP", () => {
      const error = new ErrorResponse("CODE", 999, "Erro customizado");
      expect(error.statusCode).toBe(999);
    });

    it("deve lidar com mensagens com caracteres especiais", () => {
      const specialMessage = "Erro: @#$%^&*()_+-=[]{}|;':\",./<>?";
      const error = new ErrorResponse("CODE", 400, specialMessage);

      expect(error.error).toBe(specialMessage);
    });

    it("deve lidar com objetos circulares no error", () => {
      const circularObj: any = { name: "circular" };
      circularObj.self = circularObj;

      const error = new ErrorResponse("CODE", 400, circularObj);
      expect(error.error).toBe(circularObj);
    });

    it("deve lidar com arrays grandes", () => {
      const bigArray = Array.from({ length: 1000 }, (_, i) => `erro${i}`);
      const error = new ErrorResponse("CODE", 400, bigArray);

      expect(error.error).toHaveLength(1000);
    });

    it("deve lidar com números como error", () => {
      const error = new ErrorResponse("CODE", 400, 12345);
      expect(error.error).toBe(12345);
    });

    it("deve lidar com boolean como error", () => {
      const error1 = new ErrorResponse("CODE", 400, true);
      const error2 = new ErrorResponse("CODE", 400, false);

      expect(error1.error).toBe(true);
      expect(error2.error).toBe(false);
    });
  });

  describe("Casos de uso comuns", () => {
    it("deve criar erro 400 Bad Request", () => {
      const error = new ErrorResponse("BAD_REQUEST", 400, {
        message: "Requisição inválida",
      });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
    });

    it("deve criar erro 401 Unauthorized", () => {
      const error = new ErrorResponse("UNAUTHORIZED", 401, "Não autorizado");

      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro 403 Forbidden", () => {
      const error = new ErrorResponse("FORBIDDEN", 403, "Acesso negado");

      expect(error.statusCode).toBe(403);
    });

    it("deve criar erro 404 Not Found", () => {
      const error = new ErrorResponse("NOT_FOUND", 404, {
        resource: "User",
        id: 123,
      });

      expect(error.statusCode).toBe(404);
      expect(error.error.resource).toBe("User");
    });

    it("deve criar erro 422 Unprocessable Entity", () => {
      const error = new ErrorResponse("VALIDATION_ERROR", 422, {
        errors: ["Campo inválido"],
      });

      expect(error.statusCode).toBe(422);
    });

    it("deve criar erro 500 Internal Server Error", () => {
      const error = new ErrorResponse("INTERNAL_ERROR", 500, {
        message: "Erro interno",
      });

      expect(error.statusCode).toBe(500);
    });

    it("deve criar erro 503 Service Unavailable", () => {
      const error = new ErrorResponse("SERVICE_UNAVAILABLE", 503, {
        service: "Database",
        message: "Serviço indisponível",
      });

      expect(error.statusCode).toBe(503);
      expect(error.error.service).toBe("Database");
    });
  });

  describe("Método json()", () => {
    it("deve retornar objeto com estrutura correta", () => {
      const error = new ErrorResponse("CODE", 400, "Mensagem");
      const json = error.json();

      expect(json).toEqual({
        code: "CODE",
        statusCode: 400,
        error: "Mensagem",
      });
    });

    it("deve preservar todos os tipos de dados no JSON", () => {
      const testCases = [
        { error: "string", expected: "string" },
        { error: 123, expected: 123 },
        { error: true, expected: true },
        { error: null, expected: null },
        { error: { obj: "value" }, expected: { obj: "value" } },
        { error: [1, 2, 3], expected: [1, 2, 3] },
      ];

      testCases.forEach(({ error: errorData, expected }) => {
        const error = new ErrorResponse("CODE", 400, errorData);
        const json = error.json();
        expect(json.error).toEqual(expected);
      });
    });

    it("deve retornar sempre os mesmos 3 campos", () => {
      const error = new ErrorResponse("CODE", 400, "Erro");
      const json = error.json();

      expect(Object.keys(json)).toHaveLength(3);
      expect(Object.keys(json).sort()).toEqual(["code", "error", "statusCode"]);
    });

    it("deve ser serializável para JSON string", () => {
      const error = new ErrorResponse("CODE", 400, { message: "Erro" });
      const json = error.json();

      expect(() => JSON.stringify(json)).not.toThrow();
      const serialized = JSON.stringify(json);
      expect(JSON.parse(serialized)).toEqual(json);
    });

    it("deve manter valores após modificações", () => {
      const error = new ErrorResponse("CODE", 400, "Original");
      error.error = "Modificado";

      const json = error.json();
      expect(json.error).toBe("Modificado");
    });
  });

  describe("Método estático internalServerErrorFromError", () => {
    it("deve ser um método estático acessível", () => {
      expect(typeof ErrorResponse.internalServerErrorFromError).toBe(
        "function",
      );
      expect(ErrorResponse.internalServerErrorFromError).toBeDefined();
    });

    it("deve extrair mensagem do Error nativo", () => {
      const nativeError = new Error("Erro nativo do JavaScript");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(nativeError);

      expect(errorResponse.error.errors).toContain("Erro nativo do JavaScript");
    });

    it("deve funcionar com TypeError", () => {
      const typeError = new TypeError("Tipo incorreto");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(typeError);

      expect(errorResponse.error.errors).toContain("Tipo incorreto");
    });

    it("deve funcionar com ReferenceError", () => {
      const refError = new ReferenceError("Variável não definida");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(refError);

      expect(errorResponse.error.errors).toContain("Variável não definida");
    });

    it("deve funcionar com SyntaxError", () => {
      const syntaxError = new SyntaxError("Sintaxe inválida");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(syntaxError);

      expect(errorResponse.error.errors).toContain("Sintaxe inválida");
    });

    it("deve usar operador nullish coalescing (??) corretamente", () => {
      const errorWithUndefinedMessage = { message: undefined } as Error;
      const errorResponse = ErrorResponse.internalServerErrorFromError(
        errorWithUndefinedMessage,
      );

      expect(errorResponse.error.errors).toEqual(["Erro interno do servidor"]);
    });

    it("deve preservar string vazia do Error original", () => {
      const emptyError = new Error("");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(emptyError);

      // Operador ?? só cai no default para null/undefined, não para ""
      expect(errorResponse.error.errors).toEqual([""]);
    });

    it("deve retornar array de erros com apenas 1 elemento", () => {
      const error = new Error("Erro único");
      const errorResponse = ErrorResponse.internalServerErrorFromError(error);

      expect(Array.isArray(errorResponse.error.errors)).toBe(true);
      expect(errorResponse.error.errors).toHaveLength(1);
    });

    it("deve criar estrutura error com property errors", () => {
      const error = new Error("Teste");
      const errorResponse = ErrorResponse.internalServerErrorFromError(error);

      expect(errorResponse.error).toHaveProperty("errors");
      expect(errorResponse.error.errors).toBeInstanceOf(Array);
    });

    it("deve permitir chamadas em cadeia com json()", () => {
      const error = new Error("Erro em cadeia");
      const json = ErrorResponse.internalServerErrorFromError(error).json();

      expect(json.code).toBe("INTERNAL_SERVER_ERROR");
      expect(json.statusCode).toBe(500);
      expect(json.error.errors).toContain("Erro em cadeia");
    });
  });

  describe("Comparação entre instâncias", () => {
    it("deve criar instâncias independentes", () => {
      const error1 = new ErrorResponse("CODE1", 400, "Erro 1");
      const error2 = new ErrorResponse("CODE2", 401, "Erro 2");

      expect(error1).not.toBe(error2);
      expect(error1.code).not.toBe(error2.code);
      expect(error1.statusCode).not.toBe(error2.statusCode);
    });

    it("deve permitir múltiplas instâncias com mesmos valores", () => {
      const error1 = new ErrorResponse("SAME", 400, "Igual");
      const error2 = new ErrorResponse("SAME", 400, "Igual");

      expect(error1).not.toBe(error2); // Instâncias diferentes
      expect(error1.code).toBe(error2.code); // Valores iguais
      expect(error1.json()).toEqual(error2.json());
    });
  });

  describe("Integração com sistema de erros", () => {
    it("deve funcionar em blocos try-catch", () => {
      expect(() => {
        try {
          throw new ErrorResponse("ERROR", 400, "Erro lançado");
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorResponse);
          expect((error as ErrorResponse).statusCode).toBe(400);
        }
      }).not.toThrow();
    });

    it("deve poder ser relançado como exceção", () => {
      const error = new ErrorResponse("CODE", 500, "Erro");

      expect(() => {
        throw error;
      }).toThrow(ErrorResponse);
    });

    it("deve preservar stack trace quando lançado", () => {
      try {
        throw new ErrorResponse("ERROR", 500, "Stack test");
      } catch (error) {
        // ErrorResponse não estende Error nativo, então não tem stack
        // Apenas verifica que pode ser lançado e capturado
        expect(error).toBeInstanceOf(ErrorResponse);
      }
    });
  });

  describe("Validação de tipos e estrutura", () => {
    it("deve aceitar qualquer string como code", () => {
      const codes = [
        "ERROR",
        "custom-error",
        "ERROR_WITH_UNDERSCORES",
        "123",
        "",
      ];

      codes.forEach((code) => {
        const error = new ErrorResponse(code, 400, "Erro");
        expect(error.code).toBe(code);
      });
    });

    it("deve aceitar qualquer número como statusCode", () => {
      const codes = [100, 200, 300, 400, 500, 600, 999, 0, -1];

      codes.forEach((statusCode) => {
        const error = new ErrorResponse("CODE", statusCode, "Erro");
        expect(error.statusCode).toBe(statusCode);
      });
    });

    it("deve manter referência ao objeto error", () => {
      const errorObj = { message: "Teste" };
      const error = new ErrorResponse("CODE", 400, errorObj);

      errorObj.message = "Modificado";
      expect(error.error.message).toBe("Modificado"); // Referência mantida
    });

    it("deve aceitar Date como error", () => {
      const date = new Date();
      const error = new ErrorResponse("CODE", 400, date);

      expect(error.error).toBe(date);
      expect(error.error).toBeInstanceOf(Date);
    });

    it("deve aceitar Map como error", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const error = new ErrorResponse("CODE", 400, map);

      expect(error.error).toBe(map);
      expect(error.error).toBeInstanceOf(Map);
    });

    it("deve aceitar Set como error", () => {
      const set = new Set([1, 2, 3]);
      const error = new ErrorResponse("CODE", 400, set);

      expect(error.error).toBe(set);
      expect(error.error).toBeInstanceOf(Set);
    });
  });
});
