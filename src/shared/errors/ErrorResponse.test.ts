import { ErrorResponse } from "./ErrorResponse";

describe("[SHARED] ErrorResponse", () => {
  describe("Construtor", () => {
    it("deve criar uma instância com os parâmetros corretos", () => {
      const errorResponse = new ErrorResponse("TEST_ERROR", 400, {
        errors: ["Erro de teste"],
      });

      expect(errorResponse.code).toBe("TEST_ERROR");
      expect(errorResponse.statusCode).toBe(400);
      expect(errorResponse.error).toEqual({ errors: ["Erro de teste"] });
    });

    it("deve aceitar diferentes tipos de erro", () => {
      const stringError = new ErrorResponse("STRING_ERROR", 400, "Erro string");
      expect(stringError.error).toBe("Erro string");

      const arrayError = new ErrorResponse("ARRAY_ERROR", 400, [
        "Erro 1",
        "Erro 2",
      ]);
      expect(arrayError.error).toEqual(["Erro 1", "Erro 2"]);

      const objectError = new ErrorResponse("OBJECT_ERROR", 400, {
        field: "error",
      });
      expect(objectError.error).toEqual({ field: "error" });
    });

    it("deve aceitar diferentes códigos de status HTTP", () => {
      const error400 = new ErrorResponse("BAD_REQUEST", 400, {});
      expect(error400.statusCode).toBe(400);

      const error401 = new ErrorResponse("UNAUTHORIZED", 401, {});
      expect(error401.statusCode).toBe(401);

      const error404 = new ErrorResponse("NOT_FOUND", 404, {});
      expect(error404.statusCode).toBe(404);

      const error500 = new ErrorResponse("INTERNAL_SERVER_ERROR", 500, {});
      expect(error500.statusCode).toBe(500);
    });
  });

  describe("json()", () => {
    it("deve retornar um objeto JSON com code, statusCode e error", () => {
      const errorResponse = new ErrorResponse("TEST_ERROR", 400, {
        errors: ["Erro de teste"],
      });

      const json = errorResponse.json();

      expect(json).toEqual({
        code: "TEST_ERROR",
        statusCode: 400,
        error: { errors: ["Erro de teste"] },
      });
    });

    it("deve retornar um objeto e não uma string JSON", () => {
      const errorResponse = new ErrorResponse("TEST_ERROR", 400, {});
      const json = errorResponse.json();

      expect(typeof json).toBe("object");
      expect(json).not.toBeInstanceOf(String);
    });

    it("deve incluir todas as propriedades do erro", () => {
      const complexError = {
        errors: ["Erro 1", "Erro 2"],
        properties: {
          field1: { errors: ["Campo inválido"] },
        },
      };

      const errorResponse = new ErrorResponse(
        "COMPLEX_ERROR",
        422,
        complexError,
      );
      const json = errorResponse.json();

      expect(json.error).toEqual(complexError);
      expect(json.code).toBe("COMPLEX_ERROR");
      expect(json.statusCode).toBe(422);
    });
  });

  describe("internalServerErrorFromError()", () => {
    it("deve criar um ErrorResponse a partir de um Error", () => {
      const originalError = new Error("Erro inesperado");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse).toBeInstanceOf(ErrorResponse);
      expect(errorResponse.code).toBe("INTERNAL_SERVER_ERROR");
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.error).toEqual({
        errors: ["Erro inesperado"],
      });
    });

    it("deve usar a mensagem do erro original", () => {
      const originalError = new Error("Mensagem de erro específica");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error.errors).toContain(
        "Mensagem de erro específica",
      );
    });

    it("deve usar mensagem vazia quando o erro tem mensagem vazia", () => {
      const originalError = new Error("");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error.errors).toEqual([""]);
    });

    it("deve usar mensagem padrão quando error.message é null", () => {
      const originalError = new Error("teste");
      Object.defineProperty(originalError, "message", {
        value: null,
        writable: true,
      });

      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error.errors).toEqual(["Erro interno do servidor"]);
    });

    it("deve usar mensagem padrão quando error.message é undefined", () => {
      const originalError = new Error("teste");
      Object.defineProperty(originalError, "message", {
        value: undefined,
        writable: true,
      });

      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error.errors).toEqual(["Erro interno do servidor"]);
    });

    it("deve usar mensagem padrão quando o erro não tem a propriedade message", () => {
      const originalError = {} as Error;

      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.error.errors).toEqual(["Erro interno do servidor"]);
    });

    it("deve retornar status 500", () => {
      const originalError = new Error("Qualquer erro");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);

      expect(errorResponse.statusCode).toBe(500);
    });

    it("deve retornar o JSON correto", () => {
      const originalError = new Error("Erro de sistema");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(originalError);
      const json = errorResponse.json();

      expect(json).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        error: {
          errors: ["Erro de sistema"],
        },
      });
    });

    it("deve lidar com diferentes tipos de Error", () => {
      const typeError = new TypeError("Tipo inválido");
      const errorResponse =
        ErrorResponse.internalServerErrorFromError(typeError);

      expect(errorResponse.error.errors).toContain("Tipo inválido");
    });
  });

  describe("Comportamento geral", () => {
    it("deve manter as propriedades públicas acessíveis", () => {
      const errorResponse = new ErrorResponse("TEST", 400, { test: true });

      expect(errorResponse.code).toBeDefined();
      expect(errorResponse.statusCode).toBeDefined();
      expect(errorResponse.error).toBeDefined();
    });

    it("deve permitir modificação das propriedades públicas", () => {
      const errorResponse = new ErrorResponse("TEST", 400, {});

      errorResponse.code = "MODIFIED";
      errorResponse.statusCode = 500;
      errorResponse.error = { modified: true };

      expect(errorResponse.code).toBe("MODIFIED");
      expect(errorResponse.statusCode).toBe(500);
      expect(errorResponse.error).toEqual({ modified: true });
    });
  });
});
