import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { ContaRepository } from "./ContaRepository";

jest.mock("@/sequelize/models/conta.model");
jest.mock("@/sequelize/models/cedente.model");

describe("[Repository] ContaRepository", () => {
  let repository: ContaRepository;

  beforeEach(() => {
    repository = new ContaRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve buscar conta por ID", async () => {
      const mockConta = {
        dataValues: {
          id: 1,
          produto: "boleto",
          banco_codigo: "001",
          cedente_id: 1,
          status: "active",
          configuracao_notificacao: {
            url: "https://webhook.site/conta-1",
            headers_adicionais: [],
          },
        },
      } as unknown as Conta;

      jest.spyOn(Conta, "findOne").mockResolvedValue(mockConta);

      const result = await repository.findById(1);

      expect(Conta.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
      expect(result).toBe(mockConta);
    });

    it("deve incluir configuracao_notificacao no resultado", async () => {
      const mockConta = {
        dataValues: {
          id: 2,
          configuracao_notificacao: {
            url: "https://webhook.site/conta-2",
            email: "test@example.com",
          },
        },
      } as unknown as Conta;

      jest.spyOn(Conta, "findOne").mockResolvedValue(mockConta);

      const result = await repository.findById(2);

      expect(result).toBeDefined();
      expect(result?.dataValues.configuracao_notificacao).toBeDefined();
    });

    it("deve retornar null se conta não for encontrada", async () => {
      jest.spyOn(Conta, "findOne").mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it("deve incluir relacionamento com Cedente", async () => {
      const mockConta = {
        dataValues: {
          id: 1,
          cedente_id: 1,
          configuracao_notificacao: null,
        },
        cedente: {
          dataValues: {
            id: 1,
            cnpj: "12345678000100",
          },
        },
      } as unknown as Conta;

      jest.spyOn(Conta, "findOne").mockResolvedValue(mockConta);

      const result = await repository.findById(1);

      expect(Conta.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Cedente,
            }),
          ]),
        }),
      );
    });
  });

  describe("findByIds", () => {
    it("deve buscar múltiplas contas por IDs", async () => {
      const mockContas = [
        {
          dataValues: {
            id: 1,
            configuracao_notificacao: { url: "https://webhook.site/1" },
          },
        },
        {
          dataValues: {
            id: 2,
            configuracao_notificacao: { url: "https://webhook.site/2" },
          },
        },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByIds([1, 2]);

      expect(Conta.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: expect.anything(),
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it("deve retornar array vazio se nenhuma conta for encontrada", async () => {
      jest.spyOn(Conta, "findAll").mockResolvedValue([]);

      const result = await repository.findByIds([999, 998]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("deve usar Op.in para buscar múltiplos IDs", async () => {
      jest.spyOn(Conta, "findAll").mockResolvedValue([]);

      await repository.findByIds([1, 2, 3, 4, 5]);

      expect(Conta.findAll).toHaveBeenCalled();
    });

    it("deve retornar array vazio para array de IDs vazio", async () => {
      jest.spyOn(Conta, "findAll").mockResolvedValue([]);

      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe("findByCedenteId", () => {
    it("deve buscar todas as contas de um cedente", async () => {
      const mockContas = [
        { dataValues: { id: 1, cedente_id: 1 } },
        { dataValues: { id: 2, cedente_id: 1 } },
        { dataValues: { id: 3, cedente_id: 1 } },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByCedenteId(1);

      expect(Conta.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cedente_id: 1 },
        }),
      );
      expect(result).toHaveLength(3);
    });

    it("deve retornar array vazio se cedente não tiver contas", async () => {
      jest.spyOn(Conta, "findAll").mockResolvedValue([]);

      const result = await repository.findByCedenteId(999);

      expect(result).toEqual([]);
    });

    it("deve incluir configuracao_notificacao nas contas", async () => {
      const mockContas = [
        {
          dataValues: {
            id: 1,
            cedente_id: 1,
            configuracao_notificacao: {
              url: "https://webhook.site/conta-1",
            },
          },
        },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByCedenteId(1);

      expect(result[0].dataValues.configuracao_notificacao).toBeDefined();
    });
  });

  describe("findByIdsWithRelations", () => {
    it("deve buscar contas com relacionamento Cedente carregado", async () => {
      const mockContas = [
        {
          dataValues: {
            id: 1,
            configuracao_notificacao: null,
          },
          cedente: {
            dataValues: {
              id: 1,
              configuracao_notificacao: {
                url: "https://webhook.site/cedente-1",
              },
            },
          },
        },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByIdsWithRelations([1]);

      expect(Conta.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Cedente,
            }),
          ]),
        }),
      );
      expect(result[0]).toHaveProperty("cedente");
    });

    it("deve carregar configuracao_notificacao do Cedente", async () => {
      const mockContas = [
        {
          dataValues: {
            id: 1,
            configuracao_notificacao: null,
          },
          cedente: {
            dataValues: {
              id: 1,
              configuracao_notificacao: {
                url: "https://webhook.site/cedente-1",
                headers_adicionais: [],
              },
            },
          },
        },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByIdsWithRelations([1]);

      expect(
        result[0].cedente.dataValues.configuracao_notificacao,
      ).toBeDefined();
    });

    it("deve retornar array vazio se nenhuma conta for encontrada", async () => {
      jest.spyOn(Conta, "findAll").mockResolvedValue([]);

      const result = await repository.findByIdsWithRelations([999]);

      expect(result).toEqual([]);
    });

    it("deve buscar múltiplas contas com relacionamentos", async () => {
      const mockContas = [
        {
          dataValues: { id: 1 },
          cedente: { dataValues: { id: 1 } },
        },
        {
          dataValues: { id: 2 },
          cedente: { dataValues: { id: 1 } },
        },
        {
          dataValues: { id: 3 },
          cedente: { dataValues: { id: 2 } },
        },
      ] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByIdsWithRelations([1, 2, 3]);

      expect(result).toHaveLength(3);
      expect(result.every((conta) => conta.cedente)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com configuracao_notificacao nula", async () => {
      const mockConta = {
        dataValues: {
          id: 1,
          configuracao_notificacao: null,
        },
      } as unknown as Conta;

      jest.spyOn(Conta, "findOne").mockResolvedValue(mockConta);

      const result = await repository.findById(1);

      expect(result?.dataValues.configuracao_notificacao).toBeNull();
    });

    it("deve lidar com IDs duplicados no array", async () => {
      const mockContas = [{ dataValues: { id: 1 } }] as unknown as Conta[];

      jest.spyOn(Conta, "findAll").mockResolvedValue(mockContas);

      const result = await repository.findByIds([1, 1, 1]);

      // Deve retornar apenas uma instância mesmo com IDs duplicados
      expect(result).toHaveLength(1);
    });

    it("deve lidar com erro do banco de dados", async () => {
      jest
        .spyOn(Conta, "findOne")
        .mockRejectedValue(new Error("Database connection error"));

      await expect(repository.findById(1)).rejects.toThrow(
        "Database connection error",
      );
    });
  });
});
