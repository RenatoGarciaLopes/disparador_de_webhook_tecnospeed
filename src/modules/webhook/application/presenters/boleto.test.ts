import { Servico } from "@/sequelize/models/servico.model";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";
import { BoletoPresenter } from "./boleto";

describe("BoletoPresenter", () => {
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
      product: "boleto",
      id: [1, 2, 3],
      kind: "webhook",
      type: "disponivel",
    } as ReenviarSchemaDTO;
  });

  describe("toPayload", () => {
    it("deve chamar o método toPayload corretamente", () => {
      const presenter = new BoletoPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );
      const toPayloadSpy = jest.spyOn(presenter, "toPayload");

      presenter.toPayload();

      expect(toPayloadSpy).toHaveBeenCalledTimes(1);
      toPayloadSpy.mockRestore();
    });

    it("deve retornar a estrutura correta do payload", () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date("2025-06-17T18:10:33.749-03:00"));
      const presenter = new BoletoPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );
      const payload = presenter.toPayload();

      expect(payload).toEqual({
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/fake-url",
        headers: { "content-type": "application/json" },
        body: {
          tipoWH: "",
          dataHoraEnvio: "17/06/2025 18:10:33",
          CpfCnpjCedente: "2",
          titulo: {
            situacao: "REGISTRADO",
            idintegracao: "fake-transaction-id",
            TituloNossoNumero: "",
            TituloMovimentos: {},
          },
        },
      });
    });
  });

  describe("constructor", () => {
    it("deve criar uma instância de BoletoPresenter com os dados fornecidos", () => {
      const presenter = new BoletoPresenter(
        "fake-transaction-id",
        mockServico,
        mockData,
      );

      expect(presenter).toBeInstanceOf(BoletoPresenter);
      expect(presenter).toHaveProperty("toPayload");
      expect(typeof presenter.toPayload).toBe("function");
    });
  });
});
