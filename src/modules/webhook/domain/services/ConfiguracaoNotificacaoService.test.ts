import { Servico } from "@/sequelize/models/servico.model";
import { ConfiguracaoNotificacaoService } from "./ConfiguracaoNotificacaoService";

describe("[Service] /webhook - ConfiguracaoNotificacaoService", () => {
  it("deve retornar a configuração de notificação do Cedente se a configuração da Conta não existir", async () => {
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
});
