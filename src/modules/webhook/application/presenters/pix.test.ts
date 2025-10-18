import { Servico } from "@/sequelize/models/servico.model";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";
import { PixPresenter } from "./pix";

describe("PixPresenter", () => {
  let mockServico: Servico;
  let mockData: ReenviarSchemaDTO;

  beforeEach(() => {
    mockServico = {
      dataValues: {
        id: 1,
      },
      convenio: {
        conta: {
          dataValues: {
            id: 2,
          },
          cedente: {
            dataValues: {
              id: 1,
              cnpj: "fake-cnpj",
              configuracao_notificacao: {
                url: "https://webhook.site/fake-url",
                headers_adicionais: [{ "content-type": "application/json" }],
              },
            },
          },
        },
      },
    } as unknown as Servico;

    mockData = {
      product: "pix",
      id: [1, 2, 3],
      kind: "webhook",
      type: "disponivel",
    } as ReenviarSchemaDTO;
  });

  describe("toPayload", () => {
    it("deve retornar a estrutura correta do payload", () => {
      const presenter = new PixPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );
      const payload = presenter.toPayload(
        mockServico.convenio.conta.cedente.dataValues.configuracao_notificacao!,
      );

      expect(payload).toEqual({
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/fake-url",
        headers: { "content-type": "application/json" },
        body: {
          type: "",
          companyId: 1,
          event: "ACTIVE",
          transactionId: "fake-transaction-id",
          tags: ["2", "pix", new Date().getFullYear().toString()],
          id: {
            pixId: "1",
          },
        },
      });
    });
  });
});
