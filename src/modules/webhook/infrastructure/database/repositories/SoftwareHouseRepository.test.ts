import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { SoftwareHouseRepository } from "./SoftwareHouseRepository";

jest.mock("@/sequelize/models/software-house.model");

describe("[Repository] SoftwareHouseRepository", () => {
  let repository: SoftwareHouseRepository;

  beforeEach(() => {
    repository = new SoftwareHouseRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findByCnpjAndToken", () => {
    it("deve buscar SoftwareHouse por CNPJ e Token", async () => {
      // DOCS linha 27: "O middleware deve validar se o CNPJ e o TOKEN enviados para a SH estão cadastrados na tabela `SoftwareHouse`"
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          cnpj: "11111111000111",
          token: "token-sh-123",
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSoftwareHouse);

      const result = await repository.findByCnpjAndToken(
        "11111111000111",
        "token-sh-123",
      );

      expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "11111111000111",
          token: "token-sh-123",
        },
      });
      expect(result).toBe(mockSoftwareHouse);
    });

    it("deve chamar SoftwareHouse.findOne com where correto", async () => {
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

      await repository.findByCnpjAndToken("22222222000122", "token-test");

      expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "22222222000122",
          token: "token-test",
        },
      });
    });

    it("deve retornar null quando não encontrado", async () => {
      // DOCS linha 29: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, a mesma Software House então deve ser retornado um erro 401"
      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(null);

      const result = await repository.findByCnpjAndToken(
        "99999999000199",
        "token-invalido",
      );

      expect(result).toBeNull();
    });

    it("deve retornar SoftwareHouse quando encontrada com credenciais corretas", async () => {
      const mockSoftwareHouse = {
        dataValues: {
          id: 5,
          cnpj: "33333333000133",
          token: "valid-sh-token",
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSoftwareHouse);

      const result = await repository.findByCnpjAndToken(
        "33333333000133",
        "valid-sh-token",
      );

      expect(result).toEqual(mockSoftwareHouse);
    });
  });

  describe("validateAuth", () => {
    it("deve retornar valid=true para softwarehouse ativo", async () => {
      // DOCS linhas 25-31: SH deve estar cadastrada e ativa
      // DOCS linha 23: "a validação deve ser feita em sequência, ou seja, a validação da SH deve ser feita antes da validação do Cedente"
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          cnpj: "11111111000111",
          token: "token-sh",
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth(
        "11111111000111",
        "token-sh",
      );

      expect(result.valid).toBe(true);
      expect(result.softwareHouse).toBe(mockSoftwareHouse);
    });

    it("deve retornar valid=false quando não encontrado", async () => {
      // DOCS linha 29: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, a mesma Software House então deve ser retornado um erro 401"
      jest.spyOn(repository, "findByCnpjAndToken").mockResolvedValue(null);

      const result = await repository.validateAuth(
        "99999999000199",
        "token-invalido",
      );

      expect(result.valid).toBe(false);
      expect(result.softwareHouse).toBeNull();
    });

    it("deve retornar valid=false quando status não é 'ativo'", async () => {
      // DOCS linha 31: "Se a Software House encontrada está `inativo`, então deve ser retornado um erro 401"
      const mockSoftwareHouseInativa = {
        dataValues: {
          id: 1,
          status: "inativo",
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouseInativa);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(false);
      expect(result.softwareHouse).toBe(mockSoftwareHouseInativa);
    });

    it("deve validar antes do Cedente (validação sequencial)", async () => {
      // DOCS linha 23: "Importante: a validação deve ser feita em sequência, ou seja, a validação da SH deve ser feita antes da validação do Cedente"
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      const findSpy = jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      await repository.validateAuth("11111111000111", "token");

      expect(findSpy).toHaveBeenCalledWith("11111111000111", "token");
    });

    it("deve lidar com dataValues para status", async () => {
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(true);
    });

    it("deve lidar com propriedades diretas para status", async () => {
      const mockSoftwareHouse = {
        id: 1,
        status: "ativo",
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(true);
    });

    it("deve validar status exatamente como 'ativo'", async () => {
      const mockSoftwareHouseStatus = {
        dataValues: {
          id: 1,
          status: "pendente", // Status diferente de "ativo"
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouseStatus);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(false);
    });

    it("deve retornar softwareHouse mesmo quando inválida", async () => {
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          status: "suspenso",
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(false);
      expect(result.softwareHouse).toBe(mockSoftwareHouse);
    });

    it("deve retornar ID da SoftwareHouse para uso na validação do Cedente", async () => {
      // O ID da SH é usado para validar se o Cedente pertence à ela (DOCS linha 39)
      const mockSoftwareHouse = {
        dataValues: {
          id: 42,
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(true);
      expect(result.softwareHouse?.dataValues.id).toBe(42);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com erro do banco de dados em findByCnpjAndToken", async () => {
      jest
        .spyOn(SoftwareHouse, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        repository.findByCnpjAndToken("11111111000111", "token"),
      ).rejects.toThrow("Database error");
    });

    it("deve lidar com erro do banco de dados em validateAuth", async () => {
      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockRejectedValue(new Error("Connection timeout"));

      await expect(
        repository.validateAuth("11111111000111", "token"),
      ).rejects.toThrow("Connection timeout");
    });

    it("deve lidar com status null ou undefined", async () => {
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          status: undefined,
        },
      } as unknown as SoftwareHouse;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockSoftwareHouse);

      const result = await repository.validateAuth("11111111000111", "token");

      expect(result.valid).toBe(false);
    });

    it("deve lidar com diferentes formatos de CNPJ", async () => {
      const mockSoftwareHouse = {
        dataValues: {
          id: 1,
          cnpj: "11111111000111",
          status: "ativo",
        },
      } as unknown as SoftwareHouse;

      jest.spyOn(SoftwareHouse, "findOne").mockResolvedValue(mockSoftwareHouse);

      // CNPJ sem formatação (DOCS linha 12)
      await repository.findByCnpjAndToken("11111111000111", "token");

      expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "11111111000111",
          token: "token",
        },
      });
    });
  });
});
