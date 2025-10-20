import { Servico } from "@/sequelize/models/servico.model";
import { ServicoRepository } from "./ServicoRepository";

jest.mock("@/sequelize/models/servico.model");

describe("[WEBHOOK] ServicoRepository", () => {
  let repository: ServicoRepository;

  beforeEach(() => {
    repository = new ServicoRepository();
    jest.clearAllMocks();
  });

  describe("findAllConfiguracaoNotificacaoByCedente()", () => {
    describe("Casos de sucesso", () => {
      it("deve retornar serviços quando encontrados", async () => {
        const mockServicos = [
          {
            id: 1,
            produto: "BOLETO",
            situacao: "pago",
            status: "ativo",
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: { url: "http://test.com" },
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        (Servico.findAll as jest.Mock).mockResolvedValue(mockServicos);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          5,
          [1],
          "BOLETO",
          "pago",
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      });

      it("deve chamar findAll com os parâmetros corretos", async () => {
        (Servico.findAll as jest.Mock).mockResolvedValue([]);

        await repository.findAllConfiguracaoNotificacaoByCedente(
          5,
          [1, 2, 3],
          "PIX",
          "disponivel",
        );

        expect(Servico.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              produto: "PIX",
              situacao: "disponivel",
              status: "ativo",
            }),
          }),
        );
      });

      it("deve retornar estrutura completa com configurações", async () => {
        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: { url: "http://webhook.com" },
                cedente: {
                  id: 5,
                  configuracao_notificacao: { email: "test@test.com" },
                },
              },
            },
          },
        ] as any;

        (Servico.findAll as jest.Mock).mockResolvedValue(mockServicos);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          5,
          [1],
          "BOLETO",
          "pago",
        );

        expect(result[0]).toHaveProperty("convenio");
        expect(result[0].convenio).toHaveProperty("conta");
        expect(result[0].convenio.conta).toHaveProperty(
          "configuracao_notificacao",
        );
        expect(result[0].convenio.conta.cedente).toHaveProperty(
          "configuracao_notificacao",
        );
      });

      it("deve aceitar diferentes produtos", async () => {
        const produtos: ("BOLETO" | "PAGAMENTO" | "PIX")[] = [
          "BOLETO",
          "PAGAMENTO",
          "PIX",
        ];

        for (const produto of produtos) {
          jest.clearAllMocks();
          (Servico.findAll as jest.Mock).mockResolvedValue([]);

          await repository.findAllConfiguracaoNotificacaoByCedente(
            1,
            [1],
            produto,
            "pago",
          );

          expect(Servico.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                produto,
              }),
            }),
          );
        }
      });

      it("deve aceitar diferentes situações", async () => {
        const situacoes: ("pago" | "cancelado" | "disponivel")[] = [
          "pago",
          "cancelado",
          "disponivel",
        ];

        for (const situacao of situacoes) {
          jest.clearAllMocks();
          (Servico.findAll as jest.Mock).mockResolvedValue([]);

          await repository.findAllConfiguracaoNotificacaoByCedente(
            1,
            [1],
            "BOLETO",
            situacao,
          );

          expect(Servico.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                situacao,
              }),
            }),
          );
        }
      });
    });

    describe("Filtragem por cedente", () => {
      it("deve filtrar serviços que pertencem ao cedente", async () => {
        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: null,
                cedente: {
                  id: 5,
                  configuracao_notificacao: null,
                },
              },
            },
          },
          {
            id: 2,
            convenio: {
              id: 11,
              conta: {
                id: 21,
                configuracao_notificacao: null,
                cedente: {
                  id: 99,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        (Servico.findAll as jest.Mock).mockResolvedValue(mockServicos);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          5,
          [1, 2],
          "BOLETO",
          "pago",
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      });

      it("deve retornar array vazio quando nenhum serviço pertence ao cedente", async () => {
        const mockServicos = [
          {
            id: 1,
            convenio: {
              id: 10,
              conta: {
                id: 20,
                configuracao_notificacao: null,
                cedente: {
                  id: 99,
                  configuracao_notificacao: null,
                },
              },
            },
          },
        ] as any;

        (Servico.findAll as jest.Mock).mockResolvedValue(mockServicos);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          5,
          [1],
          "BOLETO",
          "pago",
        );

        expect(result).toHaveLength(0);
      });
    });

    describe("Casos onde não encontra", () => {
      it("deve retornar array vazio quando não há serviços", async () => {
        (Servico.findAll as jest.Mock).mockResolvedValue([]);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          1,
          [999],
          "BOLETO",
          "pago",
        );

        expect(result).toEqual([]);
      });

      it("deve retornar array vazio para produto não encontrado", async () => {
        (Servico.findAll as jest.Mock).mockResolvedValue([]);

        const result = await repository.findAllConfiguracaoNotificacaoByCedente(
          1,
          [1],
          "PIX",
          "disponivel",
        );

        expect(result).toEqual([]);
      });
    });

    describe("Validação de includes", () => {
      it("deve incluir Convenio, Conta e Cedente nas queries", async () => {
        (Servico.findAll as jest.Mock).mockResolvedValue([]);

        await repository.findAllConfiguracaoNotificacaoByCedente(
          1,
          [1],
          "BOLETO",
          "pago",
        );

        expect(Servico.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.arrayContaining([
              expect.objectContaining({
                include: expect.arrayContaining([
                  expect.objectContaining({
                    attributes: ["id", "configuracao_notificacao"],
                  }),
                ]),
              }),
            ]),
          }),
        );
      });
    });

    describe("Tratamento de erros", () => {
      it("deve propagar erro do Sequelize", async () => {
        const dbError = new Error("Database connection error");
        (Servico.findAll as jest.Mock).mockRejectedValue(dbError);

        await expect(
          repository.findAllConfiguracaoNotificacaoByCedente(
            1,
            [1],
            "BOLETO",
            "pago",
          ),
        ).rejects.toThrow("Database connection error");
      });
    });
  });
});
