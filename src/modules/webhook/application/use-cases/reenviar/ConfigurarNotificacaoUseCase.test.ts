import { Servico } from "@/sequelize/models/servico.model";
import { ConfigurarNotificacaoUseCase } from "./ConfigurarNotificacaoUseCase";

describe("[Use Case] /reenviar - ConfigurarNotificacaoUseCase", () => {
  let configurarNotificacaoUseCase: ConfigurarNotificacaoUseCase;

  beforeEach(() => {
    configurarNotificacaoUseCase = new ConfigurarNotificacaoUseCase();
  });

  it("deve configurar a notificação para o boleto", async () => {
    const data = {
      product: "boleto",
      id: [1],
      kind: "webhook",
      type: "disponivel",
    };
    const servicos = [
      {
        dataValues: {
          id: 1,
          convenio: {
            conta: {
              cedente: {
                dataValues: {
                  configuracao_notificacao: {
                    url: "https://webhook.site/1234567890",
                    email: "teste@teste.com",
                    tipos: {},
                    cancelado: false,
                    pago: false,
                    disponivel: false,
                  },
                },
              },
            },
          },
        },
      } as unknown as Servico,
    ];

    await expect(
      configurarNotificacaoUseCase.execute(data, servicos),
    ).resolves.toBe(undefined);
  });
});
