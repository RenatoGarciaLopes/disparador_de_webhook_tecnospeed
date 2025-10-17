import { z } from "zod";
import { ErrorResponse } from "./ErrorResponse";
import { InvalidFieldsError } from "./InvalidFields";

describe("InvalidFieldsError", () => {
  it("deve criar uma instância da classe baseado no erro de validação zod", () => {
    jest.spyOn(z, "treeifyError").mockReturnValue({
      errors: [],
      properties: {
        name: {
          errors: ["Nome deve ser uma string"],
        },
      },
    } as any);

    const error = InvalidFieldsError.fromZodError(
      new z.ZodError([
        {
          code: "invalid_type",
          expected: "string",
          path: ["name"],
          message: "Nome deve ser uma string",
        },
      ]),
    );

    expect(z.treeifyError).toHaveBeenCalled();
    expect(error).toBeInstanceOf(InvalidFieldsError);
    expect(error.code).toEqual("INVALID_FIELDS");
    expect(error.error).toEqual({
      errors: [],
      properties: {
        name: {
          errors: ["Nome deve ser uma string"],
        },
      },
    });
  });

  describe("Construtor", () => {
    it("deve criar uma instância com código padrão 'INVALID_FIELDS'", () => {
      const errorData = { errors: ["Erro de validação"] };
      const error = new InvalidFieldsError(errorData);

      expect(error).toBeInstanceOf(InvalidFieldsError);
      expect(error.code).toBe("INVALID_FIELDS");
      expect(error.error).toEqual(errorData);
    });

    it("deve criar uma instância com código customizado", () => {
      const errorData = { errors: ["Erro customizado"] };
      const customCode = "CUSTOM_ERROR_CODE";
      const error = new InvalidFieldsError(errorData, customCode);

      expect(error.code).toBe(customCode);
      expect(error.error).toEqual(errorData);
    });

    it("deve estender ErrorResponse", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });
      expect(error).toBeInstanceOf(ErrorResponse);
    });

    it("deve ter statusCode 400", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });
      expect(error.statusCode).toBe(400);
    });

    it("deve aceitar erro com apenas errors", () => {
      const errorData = { errors: ["Erro 1", "Erro 2", "Erro 3"] };
      const error = new InvalidFieldsError(errorData);

      expect(error.error).toEqual(errorData);
      expect(error.error.errors).toHaveLength(3);
    });

    it("deve aceitar erro com apenas properties", () => {
      const errorData = {
        properties: {
          email: { errors: ["Email inválido"] },
          password: { errors: ["Senha muito curta"] },
        },
      };
      const error = new InvalidFieldsError(errorData);

      expect(error.error).toEqual(errorData);
      expect(error.error.properties).toBeDefined();
    });

    it("deve aceitar erro com errors e properties", () => {
      const errorData = {
        errors: ["Erro geral"],
        properties: {
          field: { errors: ["Erro específico"] },
        },
      };
      const error = new InvalidFieldsError(errorData);

      expect(error.error.errors).toEqual(["Erro geral"]);
      expect(error.error.properties).toBeDefined();
    });

    it("deve aceitar properties aninhadas", () => {
      const errorData = {
        properties: {
          user: {
            properties: {
              address: {
                errors: ["Endereço inválido"],
              },
            },
          },
        },
      };
      const error = new InvalidFieldsError(errorData);

      expect(error.error.properties?.user.properties?.address.errors).toEqual([
        "Endereço inválido",
      ]);
    });
  });

  describe("Método fromZodError", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("deve chamar z.treeifyError com o erro recebido", () => {
      const treeifySpy = jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: ["Erro"],
      } as any);

      const zodError = new z.ZodError([]);
      InvalidFieldsError.fromZodError(zodError);

      expect(treeifySpy).toHaveBeenCalledWith(zodError);
    });

    it("deve retornar uma instância de InvalidFieldsError", () => {
      jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: ["Erro"],
      } as any);

      const result = InvalidFieldsError.fromZodError(new z.ZodError([]));

      expect(result).toBeInstanceOf(InvalidFieldsError);
      expect(result).toBeInstanceOf(ErrorResponse);
    });

    it("deve usar o código 'INVALID_FIELDS'", () => {
      jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: ["Erro"],
      } as any);

      const error = InvalidFieldsError.fromZodError(new z.ZodError([]));

      expect(error.code).toBe("INVALID_FIELDS");
    });

    it("deve converter erros simples do Zod", () => {
      jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: ["Campo obrigatório"],
      } as any);

      const error = InvalidFieldsError.fromZodError(
        new z.ZodError([
          {
            code: "invalid_type",
            expected: "string",
            path: [],
            message: "Campo obrigatório",
          } as any,
        ]),
      );

      expect(error.error).toEqual({
        errors: ["Campo obrigatório"],
      });
    });

    it("deve converter erros com múltiplos campos do Zod", () => {
      jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: [],
        properties: {
          email: { errors: ["Email inválido"] },
          name: { errors: ["Nome obrigatório"] },
          age: { errors: ["Idade deve ser maior que 0"] },
        },
      } as any);

      const error = InvalidFieldsError.fromZodError(
        new z.ZodError([
          {
            code: "invalid_format",
            path: ["email"],
            message: "Email inválido",
          } as any,
          {
            code: "invalid_type",
            path: ["name"],
            message: "Nome obrigatório",
            expected: "string",
          } as any,
          {
            code: "too_small",
            path: ["age"],
            message: "Idade deve ser maior que 0",
            minimum: 0,
            inclusive: false,
          } as any,
        ]),
      );

      expect(error.error.properties).toBeDefined();
      expect(error.error.properties?.email).toBeDefined();
      expect(error.error.properties?.name).toBeDefined();
      expect(error.error.properties?.age).toBeDefined();
    });

    it("deve converter erros aninhados do Zod", () => {
      jest.spyOn(z, "treeifyError").mockReturnValue({
        errors: [],
        properties: {
          user: {
            errors: [],
            properties: {
              profile: {
                errors: [],
                properties: {
                  bio: {
                    errors: ["Bio muito longa"],
                  },
                },
              },
            },
          },
        },
      } as any);

      const error = InvalidFieldsError.fromZodError(
        new z.ZodError([
          {
            code: "too_big",
            path: ["user", "profile", "bio"],
            message: "Bio muito longa",
            maximum: 500,
            inclusive: true,
          } as any,
        ]),
      );

      expect(
        error.error.properties?.user.properties?.profile.properties?.bio.errors,
      ).toEqual(["Bio muito longa"]);
    });
  });

  describe("Método json()", () => {
    it("deve retornar o objeto JSON com code, statusCode e error", () => {
      const errorData = { errors: ["Erro de validação"] };
      const error = new InvalidFieldsError(errorData);

      const json = error.json();

      expect(json).toEqual({
        code: "INVALID_FIELDS",
        statusCode: 400,
        error: errorData,
      });
    });

    it("deve retornar statusCode 400 no JSON", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });
      const json = error.json();

      expect(json.statusCode).toBe(400);
    });

    it("deve incluir properties no JSON quando presentes", () => {
      const errorData = {
        errors: ["Erro geral"],
        properties: {
          field: { errors: ["Erro específico"] },
        },
      };
      const error = new InvalidFieldsError(errorData);
      const json = error.json();

      expect(json.error).toEqual(errorData);
      expect(json.error.properties).toBeDefined();
    });

    it("deve manter código customizado no JSON", () => {
      const customCode = "VALIDATION_ERROR";
      const error = new InvalidFieldsError({ errors: ["Teste"] }, customCode);
      const json = error.json();

      expect(json.code).toBe(customCode);
    });
  });

  describe("Estrutura de IFError", () => {
    it("deve aceitar erro vazio", () => {
      const errorData = {};
      const error = new InvalidFieldsError(errorData);

      expect(error.error).toEqual({});
    });

    it("deve aceitar array vazio de errors", () => {
      const errorData = { errors: [] };
      const error = new InvalidFieldsError(errorData);

      expect(error.error.errors).toEqual([]);
    });

    it("deve aceitar properties vazio", () => {
      const errorData = { properties: {} };
      const error = new InvalidFieldsError(errorData);

      expect(error.error.properties).toEqual({});
    });

    it("deve preservar a estrutura exata do erro fornecido", () => {
      const errorData = {
        errors: ["Erro 1", "Erro 2"],
        properties: {
          field1: { errors: ["Erro campo 1"] },
          field2: {
            errors: ["Erro campo 2"],
            properties: {
              nested: { errors: ["Erro aninhado"] },
            },
          },
        },
      };
      const error = new InvalidFieldsError(errorData);

      expect(error.error).toEqual(errorData);
    });
  });

  describe("Propriedades da Classe", () => {
    it("deve ter propriedade error pública acessível", () => {
      const errorData = { errors: ["Teste"] };
      const error = new InvalidFieldsError(errorData);

      expect(error.error).toBeDefined();
      expect(error.error).toBe(errorData);
    });

    it("deve ter propriedade code pública acessível", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });

      expect(error.code).toBeDefined();
      expect(typeof error.code).toBe("string");
    });

    it("deve ter propriedade statusCode herdada de ErrorResponse", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });

      expect(error.statusCode).toBeDefined();
      expect(error.statusCode).toBe(400);
    });

    it("deve permitir modificação da propriedade error", () => {
      const error = new InvalidFieldsError({ errors: ["Original"] });
      error.error = { errors: ["Modificado"] };

      expect(error.error.errors).toEqual(["Modificado"]);
    });

    it("deve permitir modificação da propriedade code", () => {
      const error = new InvalidFieldsError({ errors: ["Teste"] });
      error.code = "NEW_CODE";

      expect(error.code).toBe("NEW_CODE");
    });
  });
});
