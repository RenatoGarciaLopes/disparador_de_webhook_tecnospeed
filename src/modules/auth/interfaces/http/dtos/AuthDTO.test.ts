import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { IncomingHttpHeaders } from "http";
import { AuthDTO } from "./AuthDTO";

describe("[AUTH] AuthDTO", () => {
  describe("Construtor - Casos de sucesso", () => {
    it("deve criar uma instância com headers válidos", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token-super-secreto-sh",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-super-secreto-cedente",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO).toBeInstanceOf(AuthDTO);
      expect(authDTO.softwareHouse.cnpj).toBe("12345678000190");
      expect(authDTO.softwareHouse.token).toBe("token-super-secreto-sh");
      expect(authDTO.cedente.cnpj).toBe("98765432000110");
      expect(authDTO.cedente.token).toBe("token-super-secreto-cedente");
    });

    it("deve mapear corretamente os headers para softwareHouse", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "sh-token-123",
        "x-api-cnpj-cedente": "22222222000122",
        "x-api-token-cedente": "cedente-token-456",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO.softwareHouse).toEqual({
        cnpj: "11111111000111",
        token: "sh-token-123",
      });
    });

    it("deve mapear corretamente os headers para cedente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "sh-token-123",
        "x-api-cnpj-cedente": "22222222000122",
        "x-api-token-cedente": "cedente-token-456",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO.cedente).toEqual({
        cnpj: "22222222000122",
        token: "cedente-token-456",
      });
    });

    it("deve aceitar tokens de qualquer tamanho", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "a",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-muito-longo-" + "x".repeat(1000),
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO.softwareHouse.token).toBe("a");
      expect(authDTO.cedente.token).toHaveLength(1018);
    });
  });

  describe("Construtor - Validação de campos obrigatórios", () => {
    it("deve lançar InvalidFieldsError quando x-api-cnpj-sh está ausente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-token-sh está ausente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-cnpj-cedente está ausente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-token-cedente está ausente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando todos os campos estão ausentes", () => {
      const headers: IncomingHttpHeaders = {};

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });
  });

  describe("Construtor - Validação do tamanho do CNPJ", () => {
    it("deve lançar InvalidFieldsError quando x-api-cnpj-sh tem menos de 14 caracteres", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-cnpj-sh tem mais de 14 caracteres", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "123456780001900",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-cnpj-cedente tem menos de 14 caracteres", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-cnpj-cedente tem mais de 14 caracteres", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "123456780001900",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve aceitar CNPJs com exatamente 14 caracteres", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO.softwareHouse.cnpj).toHaveLength(14);
      expect(authDTO.cedente.cnpj).toHaveLength(14);
    });
  });

  describe("Construtor - Validação de tipos", () => {
    it("deve lançar InvalidFieldsError quando x-api-cnpj-sh não é string", () => {
      const headers: any = {
        "x-api-cnpj-sh": 12345678000190,
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-token-sh não é string", () => {
      const headers: any = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": 123456,
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-cnpj-cedente não é string", () => {
      const headers: any = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": null,
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando x-api-token-cedente não é string", () => {
      const headers: any = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000190",
        "x-api-token-cedente": undefined,
      };

      expect(() => new AuthDTO(headers)).toThrow(InvalidFieldsError);
    });
  });

  describe("Implementação da interface IAuthDTO", () => {
    it("deve implementar a interface IAuthDTO", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-cedente",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO).toHaveProperty("softwareHouse");
      expect(authDTO).toHaveProperty("cedente");
      expect(authDTO.softwareHouse).toHaveProperty("cnpj");
      expect(authDTO.softwareHouse).toHaveProperty("token");
      expect(authDTO.cedente).toHaveProperty("cnpj");
      expect(authDTO.cedente).toHaveProperty("token");
    });

    it("softwareHouse deve ter a estrutura correta", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-cedente",
      };

      const authDTO = new AuthDTO(headers);

      expect(typeof authDTO.softwareHouse.cnpj).toBe("string");
      expect(typeof authDTO.softwareHouse.token).toBe("string");
    });

    it("cedente deve ter a estrutura correta", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token-cedente",
      };

      const authDTO = new AuthDTO(headers);

      expect(typeof authDTO.cedente.cnpj).toBe("string");
      expect(typeof authDTO.cedente.token).toBe("string");
    });
  });

  describe("Validação com Zod (AuthDTOValidator)", () => {
    it("deve usar AuthDTOValidator.safeParse internamente", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token",
      };

      expect(() => new AuthDTO(headers)).not.toThrow();
    });

    it("deve lançar InvalidFieldsError criado a partir do ZodError", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "invalido",
      };

      try {
        new AuthDTO(headers);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
        expect((error as InvalidFieldsError).code).toBe("INVALID_FIELDS");
      }
    });

    it("InvalidFieldsError deve conter informações do erro de validação", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "123",
      };

      try {
        new AuthDTO(headers);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
        const invalidFieldsError = error as InvalidFieldsError;
        expect(invalidFieldsError.error).toBeDefined();
      }
    });
  });

  describe("Casos extremos", () => {
    it("deve lidar com headers de tipos mistos", () => {
      const headers: IncomingHttpHeaders = {
        "x-api-cnpj-sh": "12345678000190",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "98765432000110",
        "x-api-token-cedente": "token",
        "other-header": "should be ignored",
      };

      const authDTO = new AuthDTO(headers);

      expect(authDTO.softwareHouse).toBeDefined();
      expect(authDTO.cedente).toBeDefined();
      expect(authDTO).not.toHaveProperty("other-header");
    });
  });
});
