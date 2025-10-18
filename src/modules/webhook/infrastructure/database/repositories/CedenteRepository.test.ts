import { Cedente } from "@/sequelize/models/cedente.model";
import { CedenteRepository } from "./CedenteRepository";

jest.mock("@/sequelize/models/cedente.model");

describe("[Repository] CedenteRepository", () => {
  let repository: CedenteRepository;

  beforeEach(() => {
    repository = new CedenteRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findByCnpjAndToken", () => {
    it("deve buscar Cedente por CNPJ e Token", async () => {
      // DOCS linha 35: "O middleware deve validar se o CNPJ e o TOKEN enviados para o Cedente estão cadastrados na tabela `Cedente`"
      const mockCedente = {
        dataValues: {
          id: 1,
          cnpj: "12345678000100",
          token: "token-cedente-123",
          status: "ativo",
          softwarehouse_id: 1,
        },
      } as unknown as Cedente;

      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedente);

      const result = await repository.findByCnpjAndToken(
        "12345678000100",
        "token-cedente-123",
      );

      expect(Cedente.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "12345678000100",
          token: "token-cedente-123",
        },
      });
      expect(result).toBe(mockCedente);
    });

    it("deve chamar Cedente.findOne com where correto", async () => {
      jest.spyOn(Cedente, "findOne").mockResolvedValue(null);

      await repository.findByCnpjAndToken("11111111000111", "token-abc");

      expect(Cedente.findOne).toHaveBeenCalledWith({
        where: {
          cnpj: "11111111000111",
          token: "token-abc",
        },
      });
    });

    it("deve retornar null quando não encontrado", async () => {
      // DOCS linha 35: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, o Cedente então deve ser retornado um erro 401"
      jest.spyOn(Cedente, "findOne").mockResolvedValue(null);

      const result = await repository.findByCnpjAndToken(
        "99999999000199",
        "token-invalido",
      );

      expect(result).toBeNull();
    });

    it("deve retornar cedente quando encontrado com credenciais corretas", async () => {
      const mockCedente = {
        dataValues: {
          id: 5,
          cnpj: "88888888000188",
          token: "valid-token",
          status: "ativo",
        },
      } as unknown as Cedente;

      jest.spyOn(Cedente, "findOne").mockResolvedValue(mockCedente);

      const result = await repository.findByCnpjAndToken(
        "88888888000188",
        "valid-token",
      );

      expect(result).toEqual(mockCedente);
    });
  });

  describe("validateAuth", () => {
    it("deve retornar valid=true para cedente ativo e softwarehouse_id correto", async () => {
      // DOCS linhas 35-41: Cedente deve estar cadastrado, ativo e pertencer à SH
      const mockCedente = {
        dataValues: {
          id: 1,
          cnpj: "12345678000100",
          token: "token-cedente",
          status: "ativo",
          softwarehouse_id: 1,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token-cedente",
        1,
      );

      expect(result.valid).toBe(true);
      expect(result.cedente).toBe(mockCedente);
    });

    it("deve retornar valid=false quando cedente não encontrado", async () => {
      // DOCS linha 35: "Se o CNPJ ou o TOKEN não estão cadastrados, ou não são correspondentes, o Cedente então deve ser retornado um erro 401"
      jest.spyOn(repository, "findByCnpjAndToken").mockResolvedValue(null);

      const result = await repository.validateAuth(
        "99999999000199",
        "token-invalido",
        1,
      );

      expect(result.valid).toBe(false);
      expect(result.cedente).toBeNull();
    });

    it("deve retornar valid=false quando status não é 'ativo'", async () => {
      // DOCS linha 41: "Se o Cedente encontrado está `inativo`, então deve ser retornado um erro 401"
      const mockCedenteInativo = {
        dataValues: {
          id: 1,
          status: "inativo",
          softwarehouse_id: 1,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedenteInativo);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1,
      );

      expect(result.valid).toBe(false);
      expect(result.cedente).toBe(mockCedenteInativo);
    });

    it("deve retornar valid=false quando softwarehouse_id diferente", async () => {
      // DOCS linha 39: "Se o CNPJ do Cedente não está associado a Software House validada anteriormente, então deve ser retornado um erro 401"
      const mockCedente = {
        dataValues: {
          id: 1,
          status: "ativo",
          softwarehouse_id: 2,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1, // SH diferente (cedente pertence à SH 2)
      );

      expect(result.valid).toBe(false);
      expect(result.cedente).toBe(mockCedente);
    });

    it("deve lidar com dataValues para status", async () => {
      const mockCedente = {
        dataValues: {
          id: 1,
          status: "ativo",
          softwarehouse_id: 1,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1,
      );

      expect(result.valid).toBe(true);
    });

    it("deve lidar com propriedades diretas para status", async () => {
      const mockCedente = {
        id: 1,
        status: "ativo",
        softwarehouse_id: 1,
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1,
      );

      expect(result.valid).toBe(true);
    });

    it("deve lidar com dataValues para softwarehouse_id", async () => {
      const mockCedente = {
        dataValues: {
          id: 1,
          status: "ativo",
          softwarehouse_id: 5,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        5,
      );

      expect(result.valid).toBe(true);
    });

    it("deve lidar com propriedades diretas para softwarehouse_id", async () => {
      const mockCedente = {
        id: 1,
        status: "ativo",
        softwarehouse_id: 3,
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        3,
      );

      expect(result.valid).toBe(true);
    });

    it("deve retornar valid=false para múltiplas falhas simultâneas", async () => {
      // Cedente inativo E softwarehouse diferente
      const mockCedente = {
        dataValues: {
          id: 1,
          status: "inativo",
          softwarehouse_id: 999,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedente);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1,
      );

      expect(result.valid).toBe(false);
    });

    it("deve validar status exatamente como 'ativo'", async () => {
      const mockCedenteStatus = {
        dataValues: {
          id: 1,
          status: "pendente", // Status diferente de "ativo"
          softwarehouse_id: 1,
        },
      } as unknown as Cedente;

      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockResolvedValue(mockCedenteStatus);

      const result = await repository.validateAuth(
        "12345678000100",
        "token",
        1,
      );

      expect(result.valid).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com erro do banco de dados em findByCnpjAndToken", async () => {
      jest
        .spyOn(Cedente, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        repository.findByCnpjAndToken("12345678000100", "token"),
      ).rejects.toThrow("Database error");
    });

    it("deve lidar com erro do banco de dados em validateAuth", async () => {
      jest
        .spyOn(repository, "findByCnpjAndToken")
        .mockRejectedValue(new Error("Connection timeout"));

      await expect(
        repository.validateAuth("12345678000100", "token", 1),
      ).rejects.toThrow("Connection timeout");
    });
  });
});
