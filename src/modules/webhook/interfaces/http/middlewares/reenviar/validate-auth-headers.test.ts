import { Cedente } from "@/sequelize/models/cedente.model";
import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { validateAuthHeaders } from "./validate-auth-headers";

describe("[HTTP Middleware] /reenviar - validateAuthHeaders", () => {
  const validHeaders = new Headers({
    "x-api-cnpj-sh": "12345678901234",
    "x-api-token-sh": "token-sh-123",
    "x-api-cnpj-cedente": "98765432109876",
    "x-api-token-cedente": "token-cedente-456",
  });

  const mockSHAtiva = {
    dataValues: {
      id: 1,
      cnpj: "12345678901234",
      token: "token-sh-123",
      status: "ativo",
    },
  } as SoftwareHouse;

  const mockCedenteAtivo = {
    dataValues: {
      id: 10,
      cnpj: "98765432109876",
      token: "token-cedente-456",
      status: "ativo",
      softwarehouse_id: 1,
    },
  } as Cedente;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Validação de headers obrigatórios", () => {
    it("deve lançar erro se nenhum header for enviado", async () => {
      const emptyHeaders = new Headers();
      await expect(validateAuthHeaders(emptyHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se headers obrigatórios estiverem ausentes", async () => {
      const requiredHeaders = [
        "x-api-cnpj-sh",
        "x-api-token-sh",
        "x-api-cnpj-cedente",
        "x-api-token-cedente",
      ];

      for (const header of requiredHeaders) {
        const headers = new Headers(validHeaders);
        headers.delete(header);

        await expect(validateAuthHeaders(headers)).rejects.toThrow(
          UnauthorizedError,
        );
      }
    });

    it("deve lançar erro se headers obrigatórios estiverem vazios", async () => {
      const headersWithEmpty = new Headers({
        "x-api-cnpj-sh": "",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "cnpj",
        "x-api-token-cedente": "token",
      });

      await expect(validateAuthHeaders(headersWithEmpty)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("Validação de Software House", () => {
    it("deve lançar erro se CNPJ e TOKEN da SH não estiverem cadastrados", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

      await expect(validateAuthHeaders(validHeaders)).rejects.toThrow(
        UnauthorizedError,
      );

      expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678901234",
          token: "token-sh-123",
        },
      });
    });

    it("deve lançar erro se Software House estiver inativa", async () => {
      const shInativa = {
        dataValues: { ...mockSHAtiva.dataValues, status: "inativo" },
      } as SoftwareHouse;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(shInativa);

      await expect(validateAuthHeaders(validHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve buscar SH com CNPJ e TOKEN corretos dos headers", async () => {
      const customHeaders = new Headers({
        "x-api-cnpj-sh": "11111111111111",
        "x-api-token-sh": "custom-token",
        "x-api-cnpj-cedente": "22222222222222",
        "x-api-token-cedente": "cedente-token",
      });

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

      await validateAuthHeaders(customHeaders).catch(() => {});

      expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "11111111111111",
          token: "custom-token",
        },
      });
    });
  });

  describe("Validação de Cedente", () => {
    it("deve lançar erro se CNPJ e TOKEN do Cedente não estiverem cadastrados", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(null);

      await expect(validateAuthHeaders(validHeaders)).rejects.toThrow(
        UnauthorizedError,
      );

      expect(Cedente.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "98765432109876",
          token: "token-cedente-456",
        },
      });
    });

    it("deve lançar erro se Cedente estiver inativo", async () => {
      const cedenteInativo = {
        dataValues: { ...mockCedenteAtivo.dataValues, status: "inativo" },
      } as Cedente;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(cedenteInativo);

      await expect(validateAuthHeaders(validHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se Cedente não estiver vinculado à Software House", async () => {
      const cedenteDesvinculado = {
        dataValues: { ...mockCedenteAtivo.dataValues, softwarehouse_id: 999 },
      } as Cedente;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(cedenteDesvinculado);

      await expect(validateAuthHeaders(validHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve buscar Cedente com CNPJ e TOKEN corretos dos headers", async () => {
      const customHeaders = new Headers({
        "x-api-cnpj-sh": "11111111111111",
        "x-api-token-sh": "sh-token",
        "x-api-cnpj-cedente": "33333333333333",
        "x-api-token-cedente": "custom-cedente-token",
      });

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(null);

      await validateAuthHeaders(customHeaders).catch(() => {});

      expect(Cedente.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "33333333333333",
          token: "custom-cedente-token",
        },
      });
    });
  });

  describe("Ordem de validação", () => {
    it("deve validar SH antes de Cedente (não deve chamar Cedente se SH falhar)", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);
      const cedenteSpy = jest.spyOn(Cedente, "findOne");

      await validateAuthHeaders(validHeaders).catch(() => {});

      expect(SoftwareHouse.findOne).toHaveBeenCalled();
      expect(cedenteSpy).not.toHaveBeenCalled();
    });

    it("deve validar SH antes de Cedente (chamar Cedente apenas se SH for válida)", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedenteAtivo);

      await validateAuthHeaders(validHeaders);

      expect(SoftwareHouse.findOne).toHaveBeenCalled();
      expect(Cedente.findOne).toHaveBeenCalled();
    });
  });

  describe("Retorno de sucesso", () => {
    it("deve retornar dados de SH e Cedente quando validação for bem-sucedida", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedenteAtivo);

      const result = await validateAuthHeaders(validHeaders);

      expect(result).toEqual({
        softwarehouse: mockSHAtiva.dataValues,
        cedente: mockCedenteAtivo.dataValues,
      });
    });

    it("deve retornar estrutura com id e status de ambos", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedenteAtivo);

      const result = await validateAuthHeaders(validHeaders);

      expect(result.softwarehouse).toHaveProperty("id");
      expect(result.softwarehouse).toHaveProperty("status");
      expect(result.cedente).toHaveProperty("id");
      expect(result.cedente).toHaveProperty("status");
    });
  });

  describe("Validação de tipos de erro", () => {
    it("deve lançar UnauthorizedError com código correto", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

      try {
        await validateAuthHeaders(validHeaders);
        fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect((error as UnauthorizedError).code).toBe("UNAUTHORIZED");
        expect((error as UnauthorizedError).statusCode).toBe(401);
      }
    });

    it("deve retornar statusCode 401 para todos os erros de autenticação", async () => {
      const scenarios = [
        { sh: null, cedente: null },
        {
          sh: {
            dataValues: { ...mockSHAtiva.dataValues, status: "inativo" },
          } as SoftwareHouse,
          cedente: null,
        },
      ];

      for (const scenario of scenarios) {
        jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(scenario.sh);
        jest.spyOn(Cedente, "findOne").mockResolvedValue(scenario.cedente);

        try {
          await validateAuthHeaders(validHeaders);
          fail("Deveria ter lançado erro");
        } catch (error) {
          expect((error as UnauthorizedError).statusCode).toBe(401);
        }
      }
    });
  });

  describe("Edge cases", () => {
    it("deve tratar headers case-insensitive", async () => {
      const upperCaseHeaders = new Headers({
        "X-API-CNPJ-SH": "12345678901234",
        "X-API-TOKEN-SH": "token-sh-123",
        "X-API-CNPJ-CEDENTE": "98765432109876",
        "X-API-TOKEN-CEDENTE": "token-cedente-456",
      });

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedenteAtivo);

      const result = await validateAuthHeaders(upperCaseHeaders);

      expect(result).toBeDefined();
    });

    it("deve validar com múltiplas Software Houses no sistema", async () => {
      const sh2 = {
        dataValues: { id: 2, status: "ativo" },
      } as SoftwareHouse;

      const cedente2 = {
        dataValues: { id: 20, status: "ativo", softwarehouse_id: 2 },
      } as Cedente;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(sh2);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(cedente2);

      const result = await validateAuthHeaders(validHeaders);

      expect(result.softwarehouse.id).toBe(2);
      expect(result.cedente.id).toBe(20);
    });

    it("deve validar com CNPJs contendo apenas números", async () => {
      const numericHeaders = new Headers({
        "x-api-cnpj-sh": "00000000000000",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "11111111111111",
        "x-api-token-cedente": "token",
      });

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSHAtiva);
      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedenteAtivo);

      await expect(validateAuthHeaders(numericHeaders)).resolves.toBeDefined();
    });
  });
});
