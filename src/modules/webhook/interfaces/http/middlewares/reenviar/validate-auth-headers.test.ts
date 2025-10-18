import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { CedenteRepository } from "../../../../infrastructure/database/repositories/CedenteRepository";
import { SoftwareHouseRepository } from "../../../../infrastructure/database/repositories/SoftwareHouseRepository";
import { validateAuthHeaders } from "./validate-auth-headers";

jest.mock(
  "../../../../infrastructure/database/repositories/SoftwareHouseRepository",
);
jest.mock("../../../../infrastructure/database/repositories/CedenteRepository");

describe("[HTTP Middleware] /reenviar - validateAuthHeaders", () => {
  let mockSoftwareHouseRepository: jest.Mocked<SoftwareHouseRepository>;
  let mockCedenteRepository: jest.Mocked<CedenteRepository>;

  beforeEach(() => {
    mockSoftwareHouseRepository =
      new SoftwareHouseRepository() as jest.Mocked<SoftwareHouseRepository>;
    mockCedenteRepository =
      new CedenteRepository() as jest.Mocked<CedenteRepository>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Validação de Headers Obrigatórios", () => {
    it("deve validar presença de x-api-cnpj-sh", async () => {
      // DOCS linha 12: "x-api-cnpj-sh: string (CNPJ do SH sem formatação)"
      const headers = new Headers({
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Headers inválidos",
      );
    });

    it("deve validar presença de x-api-token-sh", async () => {
      // DOCS linha 13: "x-api-token-sh: string (Token do SH)"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Headers inválidos",
      );
    });

    it("deve validar presença de x-api-cnpj-cedente", async () => {
      // DOCS linha 14: "x-api-cnpj-cedente: number (CNPJ do Cedente sem formatação)"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-token-cedente": "token-cedente",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Headers inválidos",
      );
    });

    it("deve validar presença de x-api-token-cedente", async () => {
      // DOCS linha 15: "x-api-token-cedente: string (Token do Cedente)"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Headers inválidos",
      );
    });

    it("deve lançar UnauthorizedError se qualquer header faltar", async () => {
      // DOCS linha 21: "Para erros de validação, deve ser retornado um erro 401. Com mensagem genérica 'Não autorizado'"
      const headersEmpty = new Headers();

      await expect(validateAuthHeaders(headersEmpty)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar UnauthorizedError com mensagem 'Headers inválidos'", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Headers inválidos",
      );
    });
  });

  describe("Validação Sequencial", () => {
    it("deve validar SoftwareHouse ANTES do Cedente", async () => {
      // DOCS linha 23: "Importante: a validação deve ser feita em sequência, ou seja, a validação da SH deve ser feita antes da validação do Cedente"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: false, softwareHouse: null });

      try {
        await validateAuthHeaders(headers);
      } catch (error) {
        // Esperado falhar na validação da SH
      }

      // Deve chamar validateAuth da SH
      expect(mockSoftwareHouseRepository.validateAuth).toHaveBeenCalled();
    });

    it("deve usar SoftwareHouseRepository.validateAuth()", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 1, status: "ativo" } },
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        cedente: {
          dataValues: { id: 1, status: "ativo", softwarehouse_id: 1 },
        },
      });

      await validateAuthHeaders(headers);

      expect(mockSoftwareHouseRepository.validateAuth).toHaveBeenCalledWith(
        "11111111000111",
        "token-sh",
      );
    });

    it("deve usar CedenteRepository.validateAuth()", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 1, status: "ativo" } },
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        cedente: {
          dataValues: { id: 1, status: "ativo", softwarehouse_id: 1 },
        },
      });

      await validateAuthHeaders(headers);

      expect(mockCedenteRepository.validateAuth).toHaveBeenCalled();
    });
  });

  describe("Validação SoftwareHouse", () => {
    it("deve retornar erro 401 se SH não encontrada", async () => {
      // DOCS linha 29: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, a mesma Software House então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "99999999000199",
        "x-api-token-sh": "token-invalido",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: false, softwareHouse: null });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve retornar erro 401 se SH inativa", async () => {
      // DOCS linha 31: "Se a Software House encontrada está `inativo`, então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: false,
        softwareHouse: { dataValues: { id: 1, status: "inativo" } },
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve passar softwarehouse_id para validação do Cedente", async () => {
      // DOCS linha 39: "Se o CNPJ do Cedente não está associado a Software House validada anteriormente, então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 42, status: "ativo" } },
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        cedente: {
          dataValues: { id: 1, status: "ativo", softwarehouse_id: 42 },
        },
      });

      await validateAuthHeaders(headers);

      expect(mockCedenteRepository.validateAuth).toHaveBeenCalledWith(
        "12345678000100",
        "token-cedente",
        42, // ID da SH validada anteriormente
      );
    });
  });

  describe("Validação Cedente", () => {
    beforeEach(() => {
      // Setup padrão: SH válida
      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 1, status: "ativo" } },
      });
    });

    it("deve retornar erro 401 se Cedente não encontrado", async () => {
      // DOCS linha 35: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, o Cedente então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "99999999000199",
        "x-api-token-cedente": "token-invalido",
      });

      mockCedenteRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: false, cedente: null });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve retornar erro 401 se Cedente inativo", async () => {
      // DOCS linha 41: "Se o Cedente encontrado está `inativo`, então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: false,
        cedente: {
          dataValues: { id: 1, status: "inativo", softwarehouse_id: 1 },
        },
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve retornar erro 401 se Cedente não pertence à SH", async () => {
      // DOCS linha 39: "Se o CNPJ do Cedente não está associado a Software House validada anteriormente, então deve ser retornado um erro 401"
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: false,
        cedente: {
          dataValues: { id: 1, status: "ativo", softwarehouse_id: 999 }, // SH diferente
        },
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("Sucesso", () => {
    it("deve retornar objetos softwarehouse e cedente quando válidos", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          cnpj: "11111111000111",
          status: "ativo",
        },
      };

      const mockCedente = {
        dataValues: {
          id: 10,
          cnpj: "12345678000100",
          status: "ativo",
          softwarehouse_id: 1,
        },
      };

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: true, softwareHouse: mockSoftwareHouse });

      mockCedenteRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: true, cedente: mockCedente });

      const result = await validateAuthHeaders(headers);

      expect(result.softwarehouse).toEqual(mockSoftwareHouse);
      expect(result.cedente).toEqual(mockCedente);
    });

    it("deve incluir IDs e status dos objetos", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      const mockSoftwareHouse = {
        dataValues: {
          id: 5,
          status: "ativo",
        },
      };

      const mockCedente = {
        dataValues: {
          id: 50,
          status: "ativo",
          softwarehouse_id: 5,
        },
      };

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: true, softwareHouse: mockSoftwareHouse });

      mockCedenteRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: true, cedente: mockCedente });

      const result = await validateAuthHeaders(headers);

      expect(result.softwarehouse.dataValues.id).toBe(5);
      expect(result.softwarehouse.dataValues.status).toBe("ativo");
      expect(result.cedente.dataValues.id).toBe(50);
      expect(result.cedente.dataValues.status).toBe("ativo");
    });

    it("deve validar fluxo completo com credenciais válidas", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "valid-sh-token",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "valid-cedente-token",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 1, status: "ativo" } },
      });

      mockCedenteRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        cedente: {
          dataValues: { id: 1, status: "ativo", softwarehouse_id: 1 },
        },
      });

      const result = await validateAuthHeaders(headers);

      expect(result).toBeDefined();
      expect(result.softwarehouse).toBeDefined();
      expect(result.cedente).toBeDefined();
      expect(mockSoftwareHouseRepository.validateAuth).toHaveBeenCalledWith(
        "11111111000111",
        "valid-sh-token",
      );
      expect(mockCedenteRepository.validateAuth).toHaveBeenCalledWith(
        "12345678000100",
        "valid-cedente-token",
        1,
      );
    });
  });

  describe("Edge cases", () => {
    it("deve lançar erro se headers estiverem null", async () => {
      const headers = new Headers();

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se headers estiverem vazios", async () => {
      const headers = new Headers({});

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro genérico em qualquer falha de validação", async () => {
      // DOCS linha 21: mensagem genérica "Não autorizado" para erro 401
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token",
      });

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockResolvedValue({ valid: false, softwareHouse: null });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lidar com erro de banco de dados na validação da SH", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Database error",
      );
    });

    it("deve lidar com erro de banco de dados na validação do Cedente", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "11111111000111",
        "x-api-token-sh": "token-sh",
        "x-api-cnpj-cedente": "12345678000100",
        "x-api-token-cedente": "token-cedente",
      });

      mockSoftwareHouseRepository.validateAuth = jest.fn().mockResolvedValue({
        valid: true,
        softwareHouse: { dataValues: { id: 1, status: "ativo" } },
      });

      mockCedenteRepository.validateAuth = jest
        .fn()
        .mockRejectedValue(new Error("Connection timeout"));

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        "Connection timeout",
      );
    });
  });
});
