import { z } from "zod";
import { ErrorResponse } from "./ErrorResponse";
import { InvalidFieldsError } from "./InvalidFields";

describe("[SHARED] InvalidFieldsError", () => {
  describe("Construtor", () => {
    it("deve criar uma instância com os parâmetros corretos", () => {
      const error = {
        errors: ["Campo inválido"],
      };

      const invalidFieldsError = new InvalidFieldsError(error);

      expect(invalidFieldsError.error).toEqual(error);
      expect(invalidFieldsError.code).toBe("INVALID_FIELDS");
      expect(invalidFieldsError.status).toBe(400);
    });

    it("deve estender ErrorResponse", () => {
      const invalidFieldsError = new InvalidFieldsError({ errors: ["Erro"] });

      expect(invalidFieldsError).toBeInstanceOf(ErrorResponse);
      expect(invalidFieldsError).toBeInstanceOf(InvalidFieldsError);
    });

    it("deve usar código padrão 'INVALID_FIELDS'", () => {
      const invalidFieldsError = new InvalidFieldsError({ errors: ["Erro"] });

      expect(invalidFieldsError.code).toBe("INVALID_FIELDS");
    });

    it("deve usar status padrão 400", () => {
      const invalidFieldsError = new InvalidFieldsError({ errors: ["Erro"] });

      expect(invalidFieldsError.status).toBe(400);
    });

    it("deve permitir código customizado", () => {
      const invalidFieldsError = new InvalidFieldsError(
        { errors: ["Erro"] },
        "CUSTOM_CODE",
      );

      expect(invalidFieldsError.code).toBe("CUSTOM_CODE");
    });

    it("deve permitir status customizado", () => {
      const invalidFieldsError = new InvalidFieldsError(
        { errors: ["Erro"] },
        "INVALID_FIELDS",
        422,
      );

      expect(invalidFieldsError.status).toBe(422);
    });

    it("deve aceitar erro com propriedades aninhadas", () => {
      const error = {
        errors: ["Erro geral"],
        properties: {
          nome: {
            errors: ["Nome é obrigatório"],
          },
          email: {
            errors: ["Email inválido"],
          },
        },
      };

      const invalidFieldsError = new InvalidFieldsError(error);

      expect(invalidFieldsError.error).toEqual(error);
      expect(invalidFieldsError.error.properties).toBeDefined();
    });
  });

  describe("fromZodError()", () => {
    it("deve criar InvalidFieldsError a partir de um ZodError", () => {
      const schema = z.object({
        nome: z.string().min(3),
        email: z.email(),
      });

      const result = schema.safeParse({
        nome: "ab",
        email: "invalido",
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );

        expect(invalidFieldsError).toBeInstanceOf(InvalidFieldsError);
        expect(invalidFieldsError.code).toBe("INVALID_FIELDS");
      }
    });

    it("deve processar erros de validação do Zod", () => {
      const schema = z.object({
        idade: z.number().min(18),
      });

      const result = schema.safeParse({
        idade: 15,
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );

        expect(invalidFieldsError.error).toBeDefined();
      }
    });

    it("deve usar treeifyError para estruturar os erros", () => {
      const schema = z.object({
        usuario: z.object({
          nome: z.string().min(1),
          senha: z.string().min(6),
        }),
      });

      const result = schema.safeParse({
        usuario: {
          nome: "",
          senha: "123",
        },
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );

        expect(invalidFieldsError.error).toBeDefined();
        expect(typeof invalidFieldsError.error).toBe("object");
      }
    });

    it("deve retornar status 400 por padrão", () => {
      const schema = z.object({
        campo: z.string(),
      });

      const result = schema.safeParse({
        campo: 123,
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );

        expect(invalidFieldsError.status).toBe(400);
      }
    });

    it("deve processar múltiplos erros de validação", () => {
      const schema = z.object({
        nome: z.string().min(3),
        email: z.string().email(),
        idade: z.number().min(18),
      });

      const result = schema.safeParse({
        nome: "ab",
        email: "invalido",
        idade: 10,
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );

        expect(invalidFieldsError).toBeInstanceOf(InvalidFieldsError);
        expect(invalidFieldsError.error).toBeDefined();
      }
    });
  });

  describe("json()", () => {
    it("deve retornar JSON com estrutura correta", () => {
      const error = {
        errors: ["Campos inválidos"],
        properties: {
          nome: {
            errors: ["Nome é obrigatório"],
          },
        },
      };

      const invalidFieldsError = new InvalidFieldsError(error);
      const json = invalidFieldsError.json();

      expect(json).toEqual({
        code: "INVALID_FIELDS",
        statusCode: 400,
        error: error,
      });
    });

    it("deve incluir todos os erros aninhados", () => {
      const schema = z.object({
        endereco: z.object({
          rua: z.string().min(1),
          numero: z.number(),
        }),
      });

      const result = schema.safeParse({
        endereco: {
          rua: "",
          numero: "abc",
        },
      });

      if (!result.success) {
        const invalidFieldsError = InvalidFieldsError.fromZodError(
          result.error,
        );
        const json = invalidFieldsError.json();

        expect(json.code).toBe("INVALID_FIELDS");
        expect(json.statusCode).toBe(400);
        expect(json.error).toBeDefined();
      }
    });
  });

  describe("Integração com ErrorResponse", () => {
    it("deve ter acesso aos métodos da classe pai", () => {
      const invalidFieldsError = new InvalidFieldsError({
        errors: ["Erro"],
      });

      expect(typeof invalidFieldsError.json).toBe("function");
    });

    it("deve manter statusCode da classe pai", () => {
      const invalidFieldsError = new InvalidFieldsError(
        { errors: ["Erro"] },
        "INVALID_FIELDS",
        422,
      );

      expect(invalidFieldsError.statusCode).toBe(422);
      expect(invalidFieldsError.status).toBe(422);
    });
  });
});
