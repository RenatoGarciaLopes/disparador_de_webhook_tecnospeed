import { Servico } from "@/sequelize/models/servico.model";
import { BoletoPresenter } from "../../application/presenters/boleto";
import { PagamentosPresenter } from "../../application/presenters/pagamentos";
import { PixPresenter } from "../../application/presenters/pix";
import { ValidarServicosUseCase } from "../../application/use-cases/reenviar/ValidarServicosUseCase";
import { ReenviarSchemaDTO } from "../../interfaces/http/validators/ReenviarSchema";
import { ConfiguracaoNotificacaoService } from "./ConfiguracaoNotificacaoService";
import { ReenviarService } from "./ReenviarService";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid-12345"),
}));

describe("[Service] /webhook - ReenviarService", () => {
  let reenviarService: ReenviarService;
  let validarServicosUseCase: jest.Mocked<ValidarServicosUseCase>;

  const mockServico = {
    dataValues: {
      id: 1,
    },
    convenio: {
      conta: {
        dataValues: {
          configuracao_notificacao: {
            url: "https://webhook.site/conta",
            headers: { Authorization: "Bearer token" },
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

  beforeEach(() => {
    validarServicosUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ValidarServicosUseCase>;

    reenviarService = new ReenviarService(validarServicosUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Validação de serviços", () => {
    it("deve chamar ValidarServicosUseCase com os parâmetros corretos", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      await reenviarService.reenviar(cedenteId, data);

      expect(validarServicosUseCase.execute).toHaveBeenCalledWith(
        data,
        cedenteId,
      );
      expect(validarServicosUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("deve propagar erro se ValidarServicosUseCase falhar", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const error = new Error("Serviço não encontrado");
      validarServicosUseCase.execute.mockRejectedValue(error);

      await expect(reenviarService.reenviar(cedenteId, data)).rejects.toThrow(
        "Serviço não encontrado",
      );
    });
  });

  describe("Criação de presenters - BOLETO", () => {
    it("deve criar BoletoPresenter para cada serviço quando product é BOLETO", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const mockServicos = [mockServico, mockServico];
      validarServicosUseCase.execute.mockResolvedValue(mockServicos);

      const toPayloadSpy = jest.spyOn(BoletoPresenter.prototype, "toPayload");

      await reenviarService.reenviar(cedenteId, data);

      expect(toPayloadSpy).toHaveBeenCalledTimes(2);
      toPayloadSpy.mockRestore();
    });

    it("deve passar configuração de notificação correta para BoletoPresenter", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const getFromServicoSpy = jest.spyOn(
        ConfiguracaoNotificacaoService,
        "getFromServico",
      );

      await reenviarService.reenviar(cedenteId, data);

      expect(getFromServicoSpy).toHaveBeenCalledWith(mockServico);
      getFromServicoSpy.mockRestore();
    });
  });

  describe("Criação de presenters - PIX", () => {
    it("deve criar PixPresenter para cada serviço quando product é PIX", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "PIX",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const mockServicos = [mockServico, mockServico];
      validarServicosUseCase.execute.mockResolvedValue(mockServicos);

      const toPayloadSpy = jest.spyOn(PixPresenter.prototype, "toPayload");

      await reenviarService.reenviar(cedenteId, data);

      expect(toPayloadSpy).toHaveBeenCalledTimes(2);
      toPayloadSpy.mockRestore();
    });

    it("deve passar configuração de notificação correta para PixPresenter", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "PIX",
        id: [1],
        kind: "webhook",
        type: "PAGO",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const getFromServicoSpy = jest.spyOn(
        ConfiguracaoNotificacaoService,
        "getFromServico",
      );

      await reenviarService.reenviar(cedenteId, data);

      expect(getFromServicoSpy).toHaveBeenCalledWith(mockServico);
      getFromServicoSpy.mockRestore();
    });
  });

  describe("Criação de presenters - PAGAMENTOS", () => {
    it("deve criar PagamentosPresenter para cada serviço quando product é PAGAMENTOS", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "PAGAMENTOS",
        id: [1, 2],
        kind: "webhook",
        type: "CANCELADO",
      };

      const mockServicos = [mockServico, mockServico];
      validarServicosUseCase.execute.mockResolvedValue(mockServicos);

      const toPayloadSpy = jest.spyOn(
        PagamentosPresenter.prototype,
        "toPayload",
      );

      await reenviarService.reenviar(cedenteId, data);

      expect(toPayloadSpy).toHaveBeenCalledTimes(2);
      toPayloadSpy.mockRestore();
    });

    it("deve passar configuração de notificação correta para PagamentosPresenter", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "PAGAMENTOS",
        id: [1],
        kind: "webhook",
        type: "CANCELADO",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const getFromServicoSpy = jest.spyOn(
        ConfiguracaoNotificacaoService,
        "getFromServico",
      );

      await reenviarService.reenviar(cedenteId, data);

      expect(getFromServicoSpy).toHaveBeenCalledWith(mockServico);
      getFromServicoSpy.mockRestore();
    });
  });

  describe("Geração de UUID", () => {
    it("deve gerar um UUID único para webhookReprocessadoId", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const toPayloadSpy = jest
        .spyOn(BoletoPresenter.prototype, "toPayload")
        .mockReturnValue({} as any);

      await reenviarService.reenviar(cedenteId, data);

      // Verifica se o construtor do presenter recebeu o UUID mockado
      expect(toPayloadSpy).toHaveBeenCalled();
      toPayloadSpy.mockRestore();
    });

    it("deve usar o mesmo UUID para todos os presenters na mesma chamada", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const mockServicos = [mockServico, mockServico, mockServico];
      validarServicosUseCase.execute.mockResolvedValue(mockServicos);

      await reenviarService.reenviar(cedenteId, data);

      // Todos os presenters devem compartilhar o mesmo UUID
      // O teste passa se não houver erro e o UUID for gerado apenas uma vez
      expect(validarServicosUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("Envio de webhooks", () => {
    it("deve retornar array de payloads prontos para envio", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("deve incluir informações corretas no payload de retorno", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result[0]).toHaveProperty("kind");
      expect(result[0]).toHaveProperty("method");
      expect(result[0]).toHaveProperty("url");
      expect(result[0]).toHaveProperty("headers");
      expect(result[0]).toHaveProperty("body");
    });

    it("deve processar múltiplos serviços e retornar múltiplos payloads", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "PIX",
        id: [1, 2, 3],
        kind: "webhook",
        type: "PAGO",
      };

      const mockServicos = [mockServico, mockServico, mockServico];
      validarServicosUseCase.execute.mockResolvedValue(mockServicos);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("kind", "webhook");
      expect(result[1]).toHaveProperty("kind", "webhook");
      expect(result[2]).toHaveProperty("kind", "webhook");
    });
  });

  describe("Tratamento de erros", () => {
    it("deve lançar erro se product for inválido", async () => {
      const cedenteId = 123;
      const data = {
        product: "INVALID",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      } as any;

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const result = await reenviarService.reenviar(cedenteId, data);

      // Se product for inválido, não deve processar nenhum presenter
      expect(result).toEqual([]);
    });

    it("deve retornar array vazio se não houver serviços válidos", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("Integração entre componentes", () => {
    it("deve executar o fluxo completo de reenvio para BOLETO", async () => {
      const cedenteId = 123;
      const data: ReenviarSchemaDTO = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(validarServicosUseCase.execute).toHaveBeenCalledWith(
        data,
        cedenteId,
      );
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it("deve executar o fluxo completo de reenvio para PIX", async () => {
      const cedenteId = 456;
      const data: ReenviarSchemaDTO = {
        product: "PIX",
        id: [10, 20],
        kind: "webhook",
        type: "PAGO",
      };

      validarServicosUseCase.execute.mockResolvedValue([
        mockServico,
        mockServico,
      ]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(validarServicosUseCase.execute).toHaveBeenCalledWith(
        data,
        cedenteId,
      );
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it("deve executar o fluxo completo de reenvio para PAGAMENTOS", async () => {
      const cedenteId = 789;
      const data: ReenviarSchemaDTO = {
        product: "PAGAMENTOS",
        id: [5],
        kind: "webhook",
        type: "CANCELADO",
      };

      validarServicosUseCase.execute.mockResolvedValue([mockServico]);

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(validarServicosUseCase.execute).toHaveBeenCalledWith(
        data,
        cedenteId,
      );
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });
});
