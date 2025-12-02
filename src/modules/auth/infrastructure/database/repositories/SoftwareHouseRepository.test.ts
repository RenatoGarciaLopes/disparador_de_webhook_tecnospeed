import { SoftwareHouse } from "@/sequelize/models/software-house.model";
import { SoftwareHouseRepository } from "./SoftwareHouseRepository";

jest.mock("@/sequelize/models/software-house.model");

describe("[AUTH] SoftwareHouseRepository", () => {
  let repository: SoftwareHouseRepository;

  beforeEach(() => {
    repository = new SoftwareHouseRepository();
    jest.clearAllMocks();
  });

  describe("find()", () => {
    describe("Casos de sucesso", () => {
      it("deve retornar software house quando encontrado", async () => {
        const mockSoftwareHouse = {
          id: 1,
          cnpj: "12345678000190",
          token: "token-super-secreto",
          status: "ativo",
          data_criacao: new Date(),
        } as SoftwareHouse;

        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(
          mockSoftwareHouse,
        );

        const result = await repository.find(
          "12345678000190",
          "token-super-secreto",
        );

        expect(result).toEqual({
          id: 1,
          status: "ativo",
        });
      });

      it("deve chamar findOne com os parâmetros corretos", async () => {
        const mockSoftwareHouse = {
          id: 1,
          status: "ativo",
        } as SoftwareHouse;

        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(
          mockSoftwareHouse,
        );

        await repository.find("12345678000190", "my-token");

        expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
          where: { cnpj: "12345678000190", token: "my-token" },
        });
      });

      it("deve retornar software house com status ativo", async () => {
        const mockSoftwareHouse = {
          id: 5,
          status: "ativo",
        } as SoftwareHouse;

        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(
          mockSoftwareHouse,
        );

        const result = await repository.find("12345678000190", "token");

        expect(result).not.toBeNull();
        expect(result?.status).toBe("ativo");
      });

      it("deve retornar software house com status inativo", async () => {
        const mockSoftwareHouse = {
          id: 5,
          status: "inativo",
        } as SoftwareHouse;

        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(
          mockSoftwareHouse,
        );

        const result = await repository.find("12345678000190", "token");

        expect(result).not.toBeNull();
        expect(result?.status).toBe("inativo");
      });

      it("deve retornar apenas id e status", async () => {
        const mockSoftwareHouse = {
          id: 10,
          cnpj: "12345678000190",
          token: "token",
          status: "ativo",
          data_criacao: new Date(),
          outrosCampos: "não devem aparecer",
        } as any;

        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(
          mockSoftwareHouse,
        );

        const result = await repository.find("12345678000190", "token");

        expect(result).toEqual({
          id: 10,
          status: "ativo",
        });
        expect(result).not.toHaveProperty("cnpj");
        expect(result).not.toHaveProperty("token");
        expect(result).not.toHaveProperty("data_criacao");
      });
    });

    describe("Casos onde não encontra", () => {
      it("deve retornar null quando software house não existe", async () => {
        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find(
          "99999999000199",
          "token-inexistente",
        );

        expect(result).toBeNull();
      });

      it("deve retornar null quando CNPJ não existe", async () => {
        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find("00000000000000", "token");

        expect(result).toBeNull();
      });

      it("deve retornar null quando token está incorreto", async () => {
        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find("12345678000190", "token-errado");

        expect(result).toBeNull();
      });
    });

    describe("Validação de parâmetros", () => {
      it("deve buscar com CNPJ e token fornecidos", async () => {
        (SoftwareHouse.findOne as jest.Mock).mockResolvedValue(null);

        await repository.find("11111111000111", "token-123");

        expect(SoftwareHouse.findOne).toHaveBeenCalledWith({
          where: { cnpj: "11111111000111", token: "token-123" },
        });
      });
    });

    describe("Tratamento de erros", () => {
      it("deve propagar erro do Sequelize", async () => {
        const dbError = new Error("Database connection error");
        (SoftwareHouse.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(
          repository.find("12345678000190", "token"),
        ).rejects.toThrow("Database connection error");
      });
    });
  });
});
