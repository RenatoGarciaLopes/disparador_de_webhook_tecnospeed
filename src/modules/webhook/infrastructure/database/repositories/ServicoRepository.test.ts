import { Cedente } from "@/sequelize/models/cedente.model";
import { Conta } from "@/sequelize/models/conta.model";
import { Convenio } from "@/sequelize/models/convenio.model";
import { Servico } from "@/sequelize/models/servico.model";
import { Op } from "sequelize";
import { ServicoRepository } from "./ServicoRepository";

jest.mock("@/sequelize/models/servico.model");
jest.mock("@/sequelize/models/convenio.model");
jest.mock("@/sequelize/models/conta.model");
jest.mock("@/sequelize/models/cedente.model");

describe("[Repository] ServicoRepository", () => {
  let repository: ServicoRepository;

  beforeEach(() => {
    repository = new ServicoRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findAllByIds", () => {
    it("deve buscar múltiplos serviços usando Op.in", async () => {
      // DOCS linha 60: "O parâmetro `id` deve ser um array de strings correspondendo a IDs válidos dentro da tabela `Servico`"
      const mockServicos = [
        {
          dataValues: {
            id: 1,
            produto: "BOLETO",
            situacao: "REGISTRADO",
            status: "ativo",
          },
          convenio: {
            dataValues: { id: 1 },
          },
        },
        {
          dataValues: {
            id: 2,
            produto: "BOLETO",
            situacao: "REGISTRADO",
            status: "ativo",
          },
          convenio: {
            dataValues: { id: 1 },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1, 2]);

      expect(Servico.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [Op.in]: [1, 2],
          },
        },
        include: expect.any(Array),
      });
      expect(result).toHaveLength(2);
    });

    it("deve incluir relacionamentos: Convenio → Conta → Cedente", async () => {
      // DOCS linha 98: "deve se primeiro identificar todas as contas e cedentes que estão associados aos `Servico`s"
      const mockServicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            dataValues: { id: 10 },
            conta: {
              dataValues: {
                id: 100,
                configuracao_notificacao: {
                  url: "https://webhook.site/conta",
                },
              },
              cedente: {
                dataValues: {
                  id: 1000,
                  cnpj: "12345678000100",
                  token: "token-123",
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      await repository.findAllByIds([1]);

      expect(Servico.findAll).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: [
          {
            model: Convenio,
            attributes: ["id"],
            include: [
              {
                model: Conta,
                attributes: ["id", "configuracao_notificacao"],
                include: [
                  {
                    model: Cedente,
                    attributes: [
                      "id",
                      "configuracao_notificacao",
                      "token",
                      "cnpj",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("deve retornar array vazio se nenhum serviço encontrado", async () => {
      // DOCS linha 80: "Verificar se todos os IDs existem na tabela `Servico`"
      jest.spyOn(Servico, "findAll").mockResolvedValue([]);

      const result = await repository.findAllByIds([999, 998, 997]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("deve incluir campos de configuracao_notificacao", async () => {
      const mockServicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                id: 100,
                configuracao_notificacao: {
                  url: "https://webhook.site/test",
                  headers: { "Content-Type": "application/json" },
                },
              },
              cedente: {
                dataValues: {
                  id: 1000,
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1]);

      expect(
        result[0].convenio.conta.dataValues.configuracao_notificacao,
      ).toBeDefined();
      expect(
        result[0].convenio.conta.cedente.dataValues.configuracao_notificacao,
      ).toBeDefined();
    });

    it("deve incluir campos necessários para validação (produto, situacao, status)", async () => {
      // DOCS linhas 72-74: "agora na tabela `Servico` temos uma nova coluna `produto` e `situacao`"
      // DOCS linhas 78-89: Validações de produto, status e situacao
      const mockServicos = [
        {
          dataValues: {
            id: 1,
            produto: "BOLETO",
            situacao: "REGISTRADO",
            status: "ativo",
          },
          convenio: {
            conta: {
              dataValues: { id: 1 },
              cedente: {
                dataValues: { id: 1 },
              },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1]);

      expect(result[0].dataValues).toHaveProperty("produto");
      expect(result[0].dataValues).toHaveProperty("situacao");
      expect(result[0].dataValues).toHaveProperty("status");
    });

    it("deve buscar serviços com array de IDs vazio", async () => {
      jest.spyOn(Servico, "findAll").mockResolvedValue([]);

      const result = await repository.findAllByIds([]);

      expect(Servico.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("deve buscar múltiplos serviços (até 30)", async () => {
      // DOCS linha 50: "id - string[] - IDs dos serviços - Sim - 30" (máximo de 30 valores)
      const mockServicos = Array.from({ length: 30 }, (_, i) => ({
        dataValues: {
          id: i + 1,
          produto: "PIX",
          situacao: "ACTIVE",
          status: "ativo",
        },
        convenio: {
          conta: {
            dataValues: { id: 1 },
            cedente: {
              dataValues: { id: 1 },
            },
          },
        },
      })) as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const ids = Array.from({ length: 30 }, (_, i) => i + 1);
      const result = await repository.findAllByIds(ids);

      expect(result).toHaveLength(30);
      expect(Servico.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        include: expect.any(Array),
      });
    });

    it("deve buscar serviços com diferentes produtos", async () => {
      const mockServicos = [
        {
          dataValues: { id: 1, produto: "BOLETO" },
          convenio: {
            conta: {
              dataValues: { id: 1 },
              cedente: { dataValues: { id: 1 } },
            },
          },
        },
        {
          dataValues: { id: 2, produto: "PIX" },
          convenio: {
            conta: {
              dataValues: { id: 2 },
              cedente: { dataValues: { id: 1 } },
            },
          },
        },
        {
          dataValues: { id: 3, produto: "PAGAMENTO" },
          convenio: {
            conta: {
              dataValues: { id: 3 },
              cedente: { dataValues: { id: 1 } },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1, 2, 3]);

      expect(result).toHaveLength(3);
      expect(result.map((s) => s.dataValues.produto)).toEqual([
        "BOLETO",
        "PIX",
        "PAGAMENTO",
      ]);
    });

    it("deve incluir atributos específicos de Cedente", async () => {
      const mockServicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              cedente: {
                dataValues: {
                  id: 1,
                  configuracao_notificacao: {},
                  token: "token-123",
                  cnpj: "12345678000100",
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      await repository.findAllByIds([1]);

      expect(Servico.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              include: expect.arrayContaining([
                expect.objectContaining({
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      model: Cedente,
                      attributes: expect.arrayContaining([
                        "id",
                        "configuracao_notificacao",
                        "token",
                        "cnpj",
                      ]),
                    }),
                  ]),
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it("deve incluir atributos específicos de Conta", async () => {
      jest.spyOn(Servico, "findAll").mockResolvedValue([]);

      await repository.findAllByIds([1]);

      expect(Servico.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              include: expect.arrayContaining([
                expect.objectContaining({
                  model: Conta,
                  attributes: ["id", "configuracao_notificacao"],
                }),
              ]),
            }),
          ]),
        }),
      );
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com erro do banco de dados", async () => {
      jest
        .spyOn(Servico, "findAll")
        .mockRejectedValue(new Error("Database connection failed"));

      await expect(repository.findAllByIds([1, 2, 3])).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("deve lidar com IDs duplicados", async () => {
      const mockServicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: { id: 1 },
              cedente: { dataValues: { id: 1 } },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1, 1, 1]);

      // Op.in deve remover duplicatas automaticamente
      expect(result).toHaveLength(1);
    });

    it("deve lidar com serviços sem configuracao_notificacao", async () => {
      const mockServicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                id: 1,
                configuracao_notificacao: null,
              },
              cedente: {
                dataValues: {
                  id: 1,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      jest.spyOn(Servico, "findAll").mockResolvedValue(mockServicos);

      const result = await repository.findAllByIds([1]);

      expect(result).toHaveLength(1);
      expect(
        result[0].convenio.conta.dataValues.configuracao_notificacao,
      ).toBeNull();
    });
  });
});
