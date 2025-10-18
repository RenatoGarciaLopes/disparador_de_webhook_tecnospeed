import { Servico } from "@/sequelize/models/servico.model";
import { ConfiguracaoNotificacaoService } from "./ConfiguracaoNotificacaoService";

describe("[Service] ConfiguracaoNotificacaoService", () => {
  describe("getFromServico", () => {
    it("deve retornar configuração da Conta quando disponível", () => {
      // DOCS linha 96: "a configuração deve ser priorizada da conta"
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta-123",
                headers: { Authorization: "Bearer token-conta" },
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente-456",
                  headers: { Authorization: "Bearer token-cedente" },
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      expect(result).toEqual({
        url: "https://webhook.site/conta-123",
        headers: { Authorization: "Bearer token-conta" },
      });
    });

    it("deve retornar configuração do Cedente como fallback quando Conta não tem", () => {
      // DOCS linha 100: "Caso a configuração na Conta não exista, então será utilizada a configuração do Cedente"
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: null,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente-456",
                  headers: { Authorization: "Bearer token-cedente" },
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      expect(result).toEqual({
        url: "https://webhook.site/cedente-456",
        headers: { Authorization: "Bearer token-cedente" },
      });
    });

    it("deve priorizar configuração da Conta sobre Cedente", () => {
      // DOCS linhas 94-100: "será necessário criar uma lógica para priorizar sempre a configuração da conta"
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta-prioridade",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente-nao-usado",
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      // Deve usar a configuração da conta, não do cedente
      expect(result.url).toBe("https://webhook.site/conta-prioridade");
      expect(result.url).not.toBe("https://webhook.site/cedente-nao-usado");
    });

    it("deve lidar com configuração nula na Conta e retornar do Cedente", () => {
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: null,
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente-fallback",
                  headers: {},
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      expect(result).toEqual({
        url: "https://webhook.site/cedente-fallback",
        headers: {},
      });
    });

    it("deve lidar com configuração vazia (objeto vazio) na Conta", () => {
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {},
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

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      // Deve considerar objeto vazio como "não tem configuração" e usar cedente
      expect(result).toHaveProperty("url");
    });

    it("deve retornar configuração da Conta quando existir url na Conta", () => {
      // Teste específico: se tem URL na conta, prioriza conta
      const mockServico = {
        convenio: {
          conta: {
            dataValues: {
              configuracao_notificacao: {
                url: "https://webhook.site/conta-com-url",
              },
            },
            cedente: {
              dataValues: {
                configuracao_notificacao: {
                  url: "https://webhook.site/cedente",
                  headers: { "X-Custom": "Header" },
                },
              },
            },
          },
        },
      } as unknown as Servico;

      const result = ConfiguracaoNotificacaoService.getFromServico(mockServico);

      expect(result.url).toBe("https://webhook.site/conta-com-url");
    });
  });
});
