import { Servico } from "@/sequelize/models/servico.model";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";
import { PagamentosPresenter } from "./pagamentos";

describe("PagamentosPresenter", () => {
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
      product: "pagamento",
      id: [1, 2, 3],
      kind: "webhook",
      type: "disponivel",
    } as ReenviarSchemaDTO;
  });

  describe("toPayload", () => {
    it("deve chamar o método toPayload corretamente", () => {
      const presenter = new PagamentosPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );
      const toPayloadSpy = jest.spyOn(presenter, "toPayload");

      presenter.toPayload(
        mockServico.convenio.conta.cedente.dataValues.configuracao_notificacao!,
      );

      expect(toPayloadSpy).toHaveBeenCalledTimes(1);
      toPayloadSpy.mockRestore();
    });

    it("deve retornar a estrutura correta do payload", () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-06-17T18:10:33.749Z"));
      const presenter = new PagamentosPresenter(
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
          status: "SCHEDULED ACTIVE",
          uniqueid: "fake-transaction-id",
          createdAt: "2025-06-17T18:10:33.749Z",
          ocurrences: [],
          accountHash: "2",
          occurrences: [],
        },
      });
    });
  });

  describe("constructor", () => {
    it("deve criar uma instância de PagamentosPresenter com os dados fornecidos", () => {
      const presenter = new PagamentosPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );

      expect(presenter).toBeInstanceOf(PagamentosPresenter);
      expect(presenter).toHaveProperty("toPayload");
      expect(typeof presenter.toPayload).toBe("function");
    });
  });
});
