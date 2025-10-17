import { Servico } from "@/sequelize/models/servico.model";
import { ConfiguracaoNotificacaoService } from "../../../domain/services/ConfiguracaoNotificacaoService";
import { ConfigurarNotificacaoUseCase } from "./ConfigurarNotificacaoUseCase";

describe("[Use Case] /reenviar - ConfigurarNotificacaoUseCase", () => {
  let configurarNotificacaoUseCase: ConfigurarNotificacaoUseCase;

  beforeEach(() => {
    configurarNotificacaoUseCase = new ConfigurarNotificacaoUseCase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Agrupamento por configuração de notificação", () => {
    it("deve agrupar serviços com a mesma configuração de notificação", async () => {
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                  headers: { Authorization: "Bearer token1" },
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 2 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                  headers: { Authorization: "Bearer token1" },
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      expect(result).toHaveLength(1);
      expect(result[0].servicos).toHaveLength(2);
      expect(result[0].configuracao.url).toBe("https://webhook.site/conta1");
    });

    it("deve criar grupos separados para configurações diferentes", async () => {
      const data = {
        product: "PIX",
        id: [1, 2, 3],
        kind: "webhook",
        type: "PAGO",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 2 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta2",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente2",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 3 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      expect(result).toHaveLength(2);
      expect(result[0].servicos).toHaveLength(2); // IDs 1 e 3 com mesma URL
      expect(result[1].servicos).toHaveLength(1); // ID 2 com URL diferente
    });

    it("deve retornar array vazio quando não houver serviços", async () => {
      const data = {
        product: "BOLETO",
        id: [],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await configurarNotificacaoUseCase.execute(data, []);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("Uso do ConfiguracaoNotificacaoService", () => {
    it("deve chamar ConfiguracaoNotificacaoService.getFromServico para cada serviço", async () => {
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 2 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const getFromServicoSpy = jest.spyOn(
        ConfiguracaoNotificacaoService,
        "getFromServico",
      );

      await configurarNotificacaoUseCase.execute(data, servicos);

      expect(getFromServicoSpy).toHaveBeenCalledTimes(2);
      expect(getFromServicoSpy).toHaveBeenCalledWith(servicos[0]);
      expect(getFromServicoSpy).toHaveBeenCalledWith(servicos[1]);

      getFromServicoSpy.mockRestore();
    });

    it("deve usar configuração da Conta quando disponível", async () => {
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                  headers: { "X-Custom": "header" },
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      expect(result).toHaveLength(1);
      expect(result[0].configuracao.url).toBe("https://webhook.site/conta1");
      expect(result[0].configuracao.headers).toEqual({ "X-Custom": "header" });
    });

    it("deve usar configuração do Cedente quando Conta não tem configuração", async () => {
      const data = {
        product: "PIX",
        id: [1],
        kind: "webhook",
        type: "PAGO",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: null,
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                    headers: { "X-Cedente": "token" },
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      expect(result).toHaveLength(1);
      expect(result[0].configuracao.url).toBe("https://webhook.site/cedente1");
      expect(result[0].configuracao.headers).toEqual({ "X-Cedente": "token" });
    });
  });

  describe("Estrutura de retorno", () => {
    it("deve retornar array de grupos com configuracao e servicos", async () => {
      const data = {
        product: "PAGAMENTOS",
        id: [1],
        kind: "webhook",
        type: "CANCELADO",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/conta1",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("configuracao");
      expect(result[0]).toHaveProperty("servicos");
      expect(result[0].configuracao).toHaveProperty("url");
      expect(Array.isArray(result[0].servicos)).toBe(true);
    });

    it("deve incluir todos os serviços nos grupos retornados", async () => {
      const data = {
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: { url: "https://a.com" },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: { url: "https://b.com" },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 2 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: { url: "https://a.com" },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: { url: "https://b.com" },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 3 },
          convenio: {
            conta: {
              dataValues: {
                configuracao_notificacao: { url: "https://c.com" },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: { url: "https://b.com" },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      const totalServicos = result.reduce(
        (acc, grupo) => acc + grupo.servicos.length,
        0,
      );
      expect(totalServicos).toBe(3);
    });
  });

  describe("Cenários de múltiplas contas e cedentes", () => {
    it("deve agrupar corretamente quando há múltiplas contas com mesma URL", async () => {
      const data = {
        product: "BOLETO",
        id: [1, 2, 3, 4],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const servicos = [
        {
          dataValues: { id: 1 },
          convenio: {
            conta: {
              dataValues: {
                id: 1,
                configuracao_notificacao: {
                  url: "https://webhook.site/shared",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 2 },
          convenio: {
            conta: {
              dataValues: {
                id: 1,
                configuracao_notificacao: {
                  url: "https://webhook.site/shared",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente1",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 3 },
          convenio: {
            conta: {
              dataValues: {
                id: 2,
                configuracao_notificacao: {
                  url: "https://webhook.site/shared",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente2",
                  },
                },
              },
            },
          },
        },
        {
          dataValues: { id: 4 },
          convenio: {
            conta: {
              dataValues: {
                id: 2,
                configuracao_notificacao: {
                  url: "https://webhook.site/shared",
                },
              },
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/cedente2",
                  },
                },
              },
            },
          },
        },
      ] as unknown as Servico[];

      const result = await configurarNotificacaoUseCase.execute(data, servicos);

      // Todos devem estar no mesmo grupo pois têm a mesma URL
      expect(result).toHaveLength(1);
      expect(result[0].servicos).toHaveLength(4);
      expect(result[0].configuracao.url).toBe("https://webhook.site/shared");
    });
  });
});
