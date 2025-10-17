import { Servico } from "@/sequelize/models/servico.model";
import { ConfiguracaoNotificacaoService } from "./ConfiguracaoNotificacaoService";

describe("[Service] /webhook - ConfiguracaoNotificacaoService", () => {
  describe("Priorização de configuração", () => {
    it("deve retornar a configuração de notificação da Conta se existir", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);
      expect(configuracaoNotificacao).toEqual(
        expect.objectContaining({
          url: "https://webhook.site/conta",
        }),
      );
    });

    it("deve retornar a configuração de notificação do Cedente se a configuração da Conta for null", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: null,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);
      expect(configuracaoNotificacao).toEqual(
        expect.objectContaining({
          url: "https://webhook.site/cedente",
        }),
      );
    });

    it("deve retornar a configuração de notificação do Cedente se a configuração da Conta for undefined", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: undefined,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);
      expect(configuracaoNotificacao).toEqual(
        expect.objectContaining({
          url: "https://webhook.site/cedente",
        }),
      );
    });

    it("deve priorizar Conta mesmo quando Cedente tem configuração completa", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta-priority",
                headers: { "X-Conta": "token" },
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente-full",
                  headers: { "X-Cedente": "token" },
                  email: "cedente@test.com",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao.url).toBe(
        "https://webhook.site/conta-priority",
      );
      expect(configuracaoNotificacao).not.toEqual(
        expect.objectContaining({
          url: "https://webhook.site/cedente-full",
        }),
      );
    });
  });

  describe("Preservação de dados da configuração", () => {
    it("deve retornar todos os campos da configuração da Conta", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta",
                headers: {
                  Authorization: "Bearer token123",
                  "Content-Type": "application/json",
                },
                email: "conta@test.com",
                tipos: { webhook: true },
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toEqual({
        url: "https://webhook.site/conta",
        headers: {
          Authorization: "Bearer token123",
          "Content-Type": "application/json",
        },
        email: "conta@test.com",
        tipos: { webhook: true },
      });
    });

    it("deve retornar todos os campos da configuração do Cedente quando Conta não tem", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: null,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                  headers: {
                    "X-API-Key": "cedente-key",
                  },
                  email: "cedente@test.com",
                  tipos: { email: true, webhook: true },
                  cancelado: false,
                  pago: true,
                  disponivel: true,
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toEqual({
        url: "https://webhook.site/cedente",
        headers: {
          "X-API-Key": "cedente-key",
        },
        email: "cedente@test.com",
        tipos: { email: true, webhook: true },
        cancelado: false,
        pago: true,
        disponivel: true,
      });
    });
  });

  describe("Validação de estrutura de dados", () => {
    it("deve retornar objeto com propriedade url obrigatória", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/test",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toHaveProperty("url");
      expect(typeof configuracaoNotificacao.url).toBe("string");
      expect(configuracaoNotificacao.url).toBeTruthy();
    });

    it("deve retornar interface IConfiguracaoNotificacao válida", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta",
                headers: { "X-Test": "value" },
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toBeDefined();
      expect(configuracaoNotificacao).not.toBeNull();
      expect(typeof configuracaoNotificacao).toBe("object");
    });
  });

  describe("Casos extremos e edge cases", () => {
    it("deve lidar com headers vazios na configuração da Conta", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta",
                headers: {},
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                  headers: { "X-Default": "value" },
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao.url).toBe("https://webhook.site/conta");
      expect(configuracaoNotificacao.headers_adicionais).toEqual([]);
    });

    it("deve retornar configuração da Conta com apenas URL mínima", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://minimal.com",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                  headers: { "X-Full": "config" },
                  email: "test@test.com",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toEqual({
        url: "https://minimal.com",
      });
    });

    it("deve funcionar com múltiplos headers na configuração", () => {
      const servico = {
        dataValues: {
          id: 1,
        },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: null,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                  headers: {
                    Authorization: "Bearer token",
                    "Content-Type": "application/json",
                    "X-Custom-Header": "custom-value",
                    "X-API-Version": "v1",
                  },
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao.headers_adicionais).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Authorization: "Bearer token" }),
          expect.objectContaining({ "Content-Type": "application/json" }),
          expect.objectContaining({ "X-Custom-Header": "custom-value" }),
          expect.objectContaining({ "X-API-Version": "v1" }),
        ]),
      );
    });
  });

  describe("Integração com estrutura de Servico", () => {
    it("deve acessar corretamente a estrutura aninhada do Servico", () => {
      const servico = {
        dataValues: {
          id: 999,
          status: "ativo",
        },
        convenio: {
          id: 100,
          conta: {
            id: 50,
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/nested",
              },
            },
            cedente: {
              id: 25,
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const configuracaoNotificacao =
        ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(configuracaoNotificacao).toBeDefined();
      expect(configuracaoNotificacao.url).toBe("https://webhook.site/nested");
    });

    it("deve retornar configuração independente do ID do serviço", () => {
      const servico1 = {
        dataValues: { id: 1 },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://same-config.com",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: { url: "https://cedente.com" },
              },
            },
          },
        },
      } as unknown as Servico;

      const servico2 = {
        dataValues: { id: 999 },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://same-config.com",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: { url: "https://cedente.com" },
              },
            },
          },
        },
      } as unknown as Servico;

      const config1 = ConfiguracaoNotificacaoService.getFromServico(servico1);
      const config2 = ConfiguracaoNotificacaoService.getFromServico(servico2);

      expect(config1.url).toBe(config2.url);
      expect(config1).toEqual(config2);
    });
  });

  describe("Comportamento do método estático", () => {
    it("deve ser um método estático acessível sem instanciar a classe", () => {
      expect(typeof ConfiguracaoNotificacaoService.getFromServico).toBe(
        "function",
      );
      expect(ConfiguracaoNotificacaoService.getFromServico).toBeDefined();
    });

    it("deve retornar resultado consistente para mesmo input", () => {
      const servico = {
        dataValues: { id: 1 },
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://consistent.com",
                headers: { "X-Test": "value" },
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: { url: "https://cedente.com" },
              },
            },
          },
        },
      } as unknown as Servico;

      const result1 = ConfiguracaoNotificacaoService.getFromServico(servico);
      const result2 = ConfiguracaoNotificacaoService.getFromServico(servico);

      expect(result1).toEqual(result2);
      expect(result1.url).toBe(result2.url);
    });
  });
});
