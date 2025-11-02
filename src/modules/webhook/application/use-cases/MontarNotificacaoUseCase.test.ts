import { SituacaoMapper } from "../../domain/mappers/SituacaoMapper";
import { BoletoPresenter } from "../presenters/boleto";
import { PagamentoPresenter } from "../presenters/pagamento";
import { PixPresenter } from "../presenters/pix";
import {
  ConfiguracaoNotificacao,
  MontarNotificacaoUseCase,
} from "./MontarNotificacaoUseCase";

jest.mock("../presenters/boleto");
jest.mock("../presenters/pagamento");
jest.mock("../presenters/pix");
jest.mock("../../domain/mappers/SituacaoMapper");

jest.mock("@/infrastructure/logger/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

import { Logger } from "@/infrastructure/logger/logger";

describe("[WEBHOOK] MontarNotificacaoUseCase", () => {
  let useCase: MontarNotificacaoUseCase;
  let mockConfiguracoes: ConfiguracaoNotificacao[];

  beforeEach(() => {
    mockConfiguracoes = [
      {
        cedenteId: 1,
        servicoId: 10,
        contaId: 20,
        configuracaoNotificacao: {
          url: "http://webhook.com",
          header: true,
          header_campo: "Authorization",
          header_valor: "Bearer token123",
          headers_adicionais: [
            { "X-Custom": "value1" },
            { "X-Other": "value2" },
          ],
        },
      },
    ] as any;

    jest.clearAllMocks();

    (SituacaoMapper.toBoleto as jest.Mock).mockReturnValue("LIQUIDADO");
    (SituacaoMapper.toPagamento as jest.Mock).mockReturnValue("PAID");
    (SituacaoMapper.toPix as jest.Mock).mockReturnValue("LIQUIDATED");
  });

  describe("execute() - BOLETO", () => {
    it("deve montar notificação de boleto", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-123",
        data,
        mockConfiguracoes,
      );

      const mockBoletoPayload = {
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
      };

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue(
        mockBoletoPayload,
      );

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toHaveLength(1);
      expect(BoletoPresenter.toPayload).toHaveBeenCalled();
    });

    it("deve incluir header configurado nos headers do boleto", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-123",
        data,
        mockConfiguracoes,
      );

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(BoletoPresenter.toPayload).toHaveBeenCalledWith(
        "http://webhook.com",
        {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
        expect.objectContaining({
          webhookReprocessadoId: "test-uuid-123",
          cnpjCedente: "12.345.678/0001-90",
        }),
      );
    });

    it("deve usar SituacaoMapper.toBoleto", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "cancelado" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-456",
        data,
        mockConfiguracoes,
      );

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(SituacaoMapper.toBoleto).toHaveBeenCalledWith("cancelado");
    });

    it("não deve adicionar header quando header é false", () => {
      const configuracoes: ConfiguracaoNotificacao[] = [
        {
          cedenteId: 1,
          servicoId: 10,
          contaId: 20,
          configuracaoNotificacao: {
            url: "http://webhook.com",
            header: false,
            header_campo: "Authorization",
            header_valor: "Bearer token",
            headers_adicionais: [],
          },
        },
      ] as any;

      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-789",
        data,
        configuracoes,
      );

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(BoletoPresenter.toPayload).toHaveBeenCalledWith(
        "http://webhook.com",
        {},
        expect.any(Object),
      );
    });
  });

  describe("execute() - PAGAMENTO", () => {
    it("deve montar notificação de pagamento", () => {
      const data = {
        product: "PAGAMENTO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-123",
        data,
        mockConfiguracoes,
      );

      const mockPagamentoPayload = {
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
      };

      (PagamentoPresenter.toPayload as jest.Mock).mockReturnValue(
        mockPagamentoPayload,
      );

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toHaveLength(1);
      expect(PagamentoPresenter.toPayload).toHaveBeenCalled();
    });

    it("deve incluir headers no pagamento", () => {
      const data = {
        product: "PAGAMENTO" as const,
        kind: "webhook" as const,
        type: "cancelado" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-456",
        data,
        mockConfiguracoes,
      );

      (PagamentoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(PagamentoPresenter.toPayload).toHaveBeenCalledWith(
        "http://webhook.com",
        {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
        expect.objectContaining({
          webhookReprocessadoId: "test-uuid-456",
          contaId: 20,
        }),
      );
    });

    it("deve usar SituacaoMapper.toPagamento", () => {
      const data = {
        product: "PAGAMENTO" as const,
        kind: "webhook" as const,
        type: "disponivel" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-789",
        data,
        mockConfiguracoes,
      );

      (PagamentoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(SituacaoMapper.toPagamento).toHaveBeenCalledWith("disponivel");
    });
  });

  describe("execute() - PIX", () => {
    it("deve montar notificação de pix", () => {
      const data = {
        product: "PIX" as const,
        kind: "webhook" as const,
        type: "disponivel" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-123",
        data,
        mockConfiguracoes,
      );

      const mockPixPayload = {
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
      };

      (PixPresenter.toPayload as jest.Mock).mockReturnValue(mockPixPayload);

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toHaveLength(1);
      expect(PixPresenter.toPayload).toHaveBeenCalled();
    });

    it("deve incluir headers e IDs corretos no pix", () => {
      const data = {
        product: "PIX" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-pix",
        data,
        mockConfiguracoes,
      );

      (PixPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "98.765.432/0001-10" });

      expect(PixPresenter.toPayload).toHaveBeenCalledWith(
        "http://webhook.com",
        {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
        expect.objectContaining({
          webhookReprocessadoId: "test-uuid-pix",
          contaId: 20,
          servicoId: 10,
          cedenteId: 1,
        }),
      );
    });

    it("deve usar SituacaoMapper.toPix", () => {
      const data = {
        product: "PIX" as const,
        kind: "webhook" as const,
        type: "cancelado" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "test-uuid-abc",
        data,
        mockConfiguracoes,
      );

      (PixPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(SituacaoMapper.toPix).toHaveBeenCalledWith("cancelado");
    });
  });

  describe("Headers", () => {
    it("deve adicionar header quando configuracao tem header true", () => {
      const configuracoes: ConfiguracaoNotificacao[] = [
        {
          cedenteId: 1,
          servicoId: 10,
          contaId: 20,
          configuracaoNotificacao: {
            url: "http://webhook.com",
            header: true,
            header_campo: "X-API-Key",
            header_valor: "secret-key",
            headers_adicionais: [],
          },
        },
      ] as any;

      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, configuracoes);

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(BoletoPresenter.toPayload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          "X-API-Key": "secret-key",
        }),
        expect.any(Object),
      );
    });

    it("deve adicionar headers_adicionais", () => {
      const configuracoes: ConfiguracaoNotificacao[] = [
        {
          cedenteId: 1,
          servicoId: 10,
          contaId: 20,
          configuracaoNotificacao: {
            url: "http://webhook.com",
            header: false,
            header_campo: "",
            header_valor: "",
            headers_adicionais: [
              { "X-Header-1": "value1" },
              { "X-Header-2": "value2" },
            ],
          },
        },
      ] as any;

      const data = {
        product: "PIX" as const,
        kind: "webhook" as const,
        type: "disponivel" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, configuracoes);

      (PixPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(PixPresenter.toPayload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          "X-Header-1": "value1",
          "X-Header-2": "value2",
        }),
        expect.any(Object),
      );
    });
  });

  describe("Múltiplas configurações", () => {
    it("deve processar múltiplas configurações", () => {
      const configuracoes: ConfiguracaoNotificacao[] = [
        {
          cedenteId: 1,
          servicoId: 10,
          contaId: 20,
          configuracaoNotificacao: {
            url: "http://webhook1.com",
            header: false,
            header_campo: "",
            header_valor: "",
            headers_adicionais: [],
          },
        },
        {
          cedenteId: 1,
          servicoId: 11,
          contaId: 21,
          configuracaoNotificacao: {
            url: "http://webhook2.com",
            header: false,
            header_campo: "",
            header_valor: "",
            headers_adicionais: [],
          },
        },
      ] as any;

      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, configuracoes);

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toHaveLength(2);
      expect(BoletoPresenter.toPayload).toHaveBeenCalledTimes(2);
    });

    it("deve retornar array vazio quando não há configurações", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, []);

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toEqual([]);
    });
  });

  describe("Cobertura de branches adicionais", () => {
    it("não deve adicionar headers_adicionais quando não for array", () => {
      const configuracoes: ConfiguracaoNotificacao[] = [
        {
          cedenteId: 1,
          servicoId: 10,
          contaId: 20,
          configuracaoNotificacao: {
            url: "http://webhook.com",
            header: true,
            header_campo: "X-Only",
            header_valor: "only-value",
            headers_adicionais: undefined,
          },
        },
      ] as any;

      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, configuracoes);

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue({});

      useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(BoletoPresenter.toPayload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          "X-Only": "only-value",
        }),
        expect.any(Object),
      );
    });

    it("deve ignorar produto desconhecido (default continue)", () => {
      const data = {
        product: "DESCONHECIDO",
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase(
        "uuid",
        data as any,
        mockConfiguracoes,
      );

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(result).toHaveLength(0);
      expect(BoletoPresenter.toPayload).not.toHaveBeenCalled();
      expect(PagamentoPresenter.toPayload).not.toHaveBeenCalled();
      expect(PixPresenter.toPayload).not.toHaveBeenCalled();
    });

    it("não empilha payload quando presenter retorna falsy", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, mockConfiguracoes);

      (BoletoPresenter.toPayload as jest.Mock).mockReturnValue(null);

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(BoletoPresenter.toPayload).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(0);
    });

    it("deve logar erro quando presenter lança exceção com message", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, mockConfiguracoes);

      const error = new Error("Erro ao montar payload de boleto");
      (BoletoPresenter.toPayload as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(Logger.warn).toHaveBeenCalledWith(
        `Erro ao montar payload: url=http://webhook.com, error=${error.message}`,
      );
      expect(result).toHaveLength(0);
    });

    it("deve logar erro quando presenter lança exceção sem message", () => {
      const data = {
        product: "PAGAMENTO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, mockConfiguracoes);

      const errorWithoutMessage = {} as Error;
      (PagamentoPresenter.toPayload as jest.Mock).mockImplementation(() => {
        throw errorWithoutMessage;
      });

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(Logger.warn).toHaveBeenCalledWith(
        `Erro ao montar payload: url=http://webhook.com, error=${errorWithoutMessage?.message}`,
      );
      expect(result).toHaveLength(0);
    });

    it("deve logar erro quando presenter lança exceção não Error", () => {
      const data = {
        product: "PIX" as const,
        kind: "webhook" as const,
        type: "disponivel" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, mockConfiguracoes);

      const nonErrorException = "String error" as any;
      (PixPresenter.toPayload as jest.Mock).mockImplementation(() => {
        throw nonErrorException;
      });

      const result = useCase.execute({ cnpjCedente: "12.345.678/0001-90" });

      expect(Logger.warn).toHaveBeenCalledWith(
        `Erro ao montar payload: url=http://webhook.com, error=${nonErrorException?.message}`,
      );
      expect(result).toHaveLength(0);
    });
  });
});
