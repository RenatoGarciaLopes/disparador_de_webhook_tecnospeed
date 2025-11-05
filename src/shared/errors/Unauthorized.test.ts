import { ErrorResponse } from "./ErrorResponse";
import { UnauthorizedError } from "./Unauthorized";

describe("[SHARED] UnauthorizedError", () => {
  describe("Construtor", () => {
    it("deve criar uma instância com os parâmetros corretos", () => {
      const unauthorizedError = new UnauthorizedError(
        "Token inválido ou expirado",
      );

      expect(unauthorizedError.errors).toBe("Token inválido ou expirado");
      expect(unauthorizedError.code).toBe("UNAUTHORIZED");
    });

    it("deve estender ErrorResponse", () => {
      const unauthorizedError = new UnauthorizedError("Acesso negado");

      expect(unauthorizedError).toBeInstanceOf(ErrorResponse);
      expect(unauthorizedError).toBeInstanceOf(UnauthorizedError);
    });

    it("deve usar código padrão 'UNAUTHORIZED'", () => {
      const unauthorizedError = new UnauthorizedError("Erro de autenticação");

      expect(unauthorizedError.code).toBe("UNAUTHORIZED");
    });

    it("deve usar status 401", () => {
      const unauthorizedError = new UnauthorizedError("Não autorizado");

      expect(unauthorizedError.statusCode).toBe(401);
    });

    it("deve permitir código customizado", () => {
      const unauthorizedError = new UnauthorizedError(
        "Token expirado",
        "TOKEN_EXPIRED",
      );

      expect(unauthorizedError.code).toBe("TOKEN_EXPIRED");
    });

    it("deve aceitar diferentes mensagens de erro", () => {
      const error1 = new UnauthorizedError("Credenciais inválidas");
      expect(error1.errors).toBe("Credenciais inválidas");

      const error2 = new UnauthorizedError("Sessão expirada");
      expect(error2.errors).toBe("Sessão expirada");

      const error3 = new UnauthorizedError("Acesso negado");
      expect(error3.errors).toBe("Acesso negado");
    });
  });

  describe("json()", () => {
    it("deve retornar JSON com estrutura correta", () => {
      const unauthorizedError = new UnauthorizedError("Token inválido");
      const json = unauthorizedError.json();

      expect(json).toEqual({
        code: "UNAUTHORIZED",
        statusCode: 401,
        error: "Token inválido",
      });
    });

    it("deve incluir código customizado no JSON", () => {
      const unauthorizedError = new UnauthorizedError(
        "Token expirado",
        "TOKEN_EXPIRED",
      );
      const json = unauthorizedError.json();

      expect(json).toEqual({
        code: "TOKEN_EXPIRED",
        statusCode: 401,
        error: "Token expirado",
      });
    });
  });

  describe("Integração com ErrorResponse", () => {
    it("deve ter acesso aos métodos da classe pai", () => {
      const unauthorizedError = new UnauthorizedError("Erro");

      expect(typeof unauthorizedError.json).toBe("function");
    });

    it("deve manter a consistência do statusCode", () => {
      const unauthorizedError = new UnauthorizedError("Erro");

      const json = unauthorizedError.json();
      expect(json.statusCode).toBe(401);
      expect(unauthorizedError.statusCode).toBe(401);
    });

    it("deve permitir acesso e modificação das propriedades públicas", () => {
      const unauthorizedError = new UnauthorizedError("Erro original");

      unauthorizedError.errors = "Erro modificado";
      expect(unauthorizedError.errors).toBe("Erro modificado");

      unauthorizedError.code = "NEW_CODE";
      expect(unauthorizedError.code).toBe("NEW_CODE");
    });
  });
});
