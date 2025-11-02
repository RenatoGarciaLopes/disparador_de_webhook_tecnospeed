import { Cedente } from "@/sequelize/models/cedente.model";
import { CedenteRepository } from "./CedenteRepository";

jest.mock("@/sequelize/models/cedente.model");

describe("[AUTH] CedenteRepository", () => {
  let repository: CedenteRepository;

  beforeEach(() => {
    repository = new CedenteRepository();
    jest.clearAllMocks();
  });

  describe("find()", () => {
    describe("Casos de sucesso", () => {
      it("deve retornar cedente quando encontrado", async () => {
        const mockCedente = {
          id: 1,
          cnpj: "98.765.432/0001-10",
          token: "token-cedente",
          softwarehouse_id: 5,
          status: "ativo",
          data_criacao: new Date(),
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        const result = await repository.find(
          "98.765.432/0001-10",
          "token-cedente",
          5,
        );

        expect(result).toEqual({
          id: 1,
          status: "ativo",
        });
      });

      it("deve chamar findOne com os parâmetros corretos", async () => {
        const mockCedente = {
          id: 1,
          status: "ativo",
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        await repository.find("98.765.432/0001-10", "my-token", 10);

        expect(Cedente.findOne).toHaveBeenCalledWith({
          where: {
            cnpj: "98.765.432/0001-10",
            token: "my-token",
            softwarehouse_id: 10,
          },
        });
      });

      it("deve retornar cedente com status ativo", async () => {
        const mockCedente = {
          id: 2,
          status: "ativo",
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        const result = await repository.find("98.765.432/0001-10", "token", 5);

        expect(result).not.toBeNull();
        expect(result?.status).toBe("ativo");
      });

      it("deve retornar cedente com status inativo", async () => {
        const mockCedente = {
          id: 2,
          status: "inativo",
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        const result = await repository.find("98.765.432/0001-10", "token", 5);

        expect(result).not.toBeNull();
        expect(result?.status).toBe("inativo");
      });

      it("deve retornar apenas id e status", async () => {
        const mockCedente = {
          id: 10,
          cnpj: "98.765.432/0001-10",
          token: "token",
          softwarehouse_id: 5,
          status: "ativo",
          data_criacao: new Date(),
          configuracao_notificacao: null,
          outrosCampos: "não devem aparecer",
        } as any;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        const result = await repository.find("98.765.432/0001-10", "token", 5);

        expect(result).toEqual({
          id: 10,
          status: "ativo",
        });
        expect(result).not.toHaveProperty("cnpj");
        expect(result).not.toHaveProperty("token");
        expect(result).not.toHaveProperty("softwarehouse_id");
        expect(result).not.toHaveProperty("data_criacao");
      });

      it("deve validar associação com software house correto", async () => {
        const mockCedente = {
          id: 3,
          softwarehouse_id: 100,
          status: "ativo",
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        await repository.find("98.765.432/0001-10", "token", 100);

        expect(Cedente.findOne).toHaveBeenCalledWith({
          where: {
            cnpj: "98.765.432/0001-10",
            token: "token",
            softwarehouse_id: 100,
          },
        });
      });
    });

    describe("Casos onde não encontra", () => {
      it("deve retornar null quando cedente não existe", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find(
          "99.999.999/0001-99",
          "token-inexistente",
          1,
        );

        expect(result).toBeNull();
      });

      it("deve retornar null quando CNPJ não existe", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find("00.000.000/0000-00", "token", 1);

        expect(result).toBeNull();
      });

      it("deve retornar null quando token está incorreto", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find(
          "98.765.432/0001-10",
          "token-errado",
          1,
        );

        expect(result).toBeNull();
      });

      it("deve retornar null quando softwareHouseId não corresponde", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find(
          "98.765.432/0001-10",
          "token",
          999,
        );

        expect(result).toBeNull();
      });

      it("deve retornar null quando cedente pertence a outro software house", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        await repository.find("98.765.432/0001-10", "token", 1);

        expect(Cedente.findOne).toHaveBeenCalledWith({
          where: {
            cnpj: "98.765.432/0001-10",
            token: "token",
            softwarehouse_id: 1,
          },
        });
      });
    });

    describe("Validação de parâmetros", () => {
      it("deve buscar com CNPJ, token e softwareHouseId fornecidos", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        await repository.find("11.111.111/0001-11", "token-123", 5);

        expect(Cedente.findOne).toHaveBeenCalledWith({
          where: {
            cnpj: "11.111.111/0001-11",
            token: "token-123",
            softwarehouse_id: 5,
          },
        });
      });
    });

    describe("Tratamento de erros", () => {
      it("deve propagar erro do Sequelize", async () => {
        const dbError = new Error("Database connection error");
        (Cedente.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(
          repository.find("98.765.432/0001-10", "token", 1),
        ).rejects.toThrow("Database connection error");
      });
    });

    describe("Relacionamento com SoftwareHouse", () => {
      it("deve garantir que cedente pertence ao software house correto", async () => {
        const mockCedente = {
          id: 1,
          softwarehouse_id: 5,
          status: "ativo",
        } as Cedente;

        (Cedente.findOne as jest.Mock).mockResolvedValue(mockCedente);

        await repository.find("98.765.432/0001-10", "token", 5);

        expect(Cedente.findOne).toHaveBeenCalledWith({
          where: expect.objectContaining({
            softwarehouse_id: 5,
          }),
        });
      });

      it("não deve retornar cedente de outro software house", async () => {
        (Cedente.findOne as jest.Mock).mockResolvedValue(null);

        const result = await repository.find(
          "98.765.432/0001-10",
          "token",
          999,
        );

        expect(result).toBeNull();
      });
    });
  });
});
