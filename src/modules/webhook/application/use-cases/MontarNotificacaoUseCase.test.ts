import {
  ConfiguracaoNotificacao,
  MontarNotificacaoUseCase,
} from "./MontarNotificacaoUseCase";

import { Logger } from "@/infrastructure/logger/logger";
import { BoletoPresenter } from "../presenters/boleto";

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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
        body: {
          CpfCnpjCedente: "12345678000190",
          titulo: {
            situacao: "LIQUIDADO", // SituacaoMapper.toBoleto("pago")
            idintegracao: "test-uuid-123",
          },
        },
      });
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].headers).toEqual({
        Authorization: "Bearer token123",
        "X-Custom": "value1",
        "X-Other": "value2",
      });
      expect(result[0].body.CpfCnpjCedente).toBe("12345678000190");
      expect(result[0].body.titulo.idintegracao).toBe("test-uuid-123");
    });

    it("deve usar SituacaoMapper.toBoleto corretamente", () => {
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      // Verifica se a situação foi mapeada corretamente: cancelado -> BAIXADO
      expect(result[0].body.titulo.situacao).toBe("BAIXADO");
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].headers).toEqual({});
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
      });
      // PagamentoPresenter usa "status" (não "situacao")
      expect(result[0].body.status).toBe("PAID"); // SituacaoMapper.toPagamento("pago")
    });

    it("deve incluir headers e dados corretos no pagamento", () => {
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].url).toBe("http://webhook.com");
      expect(result[0].headers).toEqual({
        Authorization: "Bearer token123",
        "X-Custom": "value1",
        "X-Other": "value2",
      });
      // PagamentoPresenter usa "uniqueid" (não "idintegracao")
      expect(result[0].body.uniqueid).toBe("test-uuid-456");
      expect(result[0].body.status).toBe("CANCELLED"); // SituacaoMapper.toPagamento("cancelado")
    });

    it("deve usar SituacaoMapper.toPagamento corretamente", () => {
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      // Verifica se a situação foi mapeada corretamente: disponivel -> SCHEDULED
      expect(result[0].body.status).toBe("SCHEDULED");
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        kind: "webhook",
        method: "POST",
        url: "http://webhook.com",
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value1",
          "X-Other": "value2",
        },
      });
      // PixPresenter usa "event" (não "situacao")
      expect(result[0].body.event).toBe("ACTIVE"); // SituacaoMapper.toPix("disponivel")
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

      const result = useCase.execute({ cnpjCedente: "98765432000110" });

      expect(result[0].url).toBe("http://webhook.com");
      expect(result[0].headers).toEqual({
        Authorization: "Bearer token123",
        "X-Custom": "value1",
        "X-Other": "value2",
      });
      // PixPresenter usa "transactionId" (não "idintegracao")
      expect(result[0].body.transactionId).toBe("test-uuid-pix");
      expect(result[0].body.event).toBe("LIQUIDATED"); // SituacaoMapper.toPix("pago")
    });

    it("deve usar SituacaoMapper.toPix corretamente", () => {
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      // Verifica se a situação foi mapeada corretamente: cancelado -> REJECTED
      expect(result[0].body.event).toBe("REJECTED");
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].headers).toEqual({
        "X-API-Key": "secret-key",
      });
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].headers).toEqual({
        "X-Header-1": "value1",
        "X-Header-2": "value2",
      });
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe("http://webhook1.com");
      expect(result[1].url).toBe("http://webhook2.com");
    });

    it("deve retornar array vazio quando não há configurações", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      useCase = new MontarNotificacaoUseCase("uuid", data, []);

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result[0].headers).toEqual({
        "X-Only": "only-value",
      });
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

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      // Produto desconhecido não gera payload
      expect(result).toHaveLength(0);
    });

    it("deve logar warn quando presenter lançar erro e continuar o loop", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      const spy = jest
        .spyOn(BoletoPresenter, "toPayload")
        .mockImplementation(() => {
          throw new Error("boom");
        });

      useCase = new MontarNotificacaoUseCase(
        "uuid-err",
        data,
        mockConfiguracoes,
      );

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("error=boom"),
      );
      expect(result).toHaveLength(0);

      spy.mockRestore();
    });

    it("não deve empilhar payload quando presenter retornar undefined", () => {
      const data = {
        product: "BOLETO" as const,
        kind: "webhook" as const,
        type: "pago" as const,
      };

      const spy = jest
        .spyOn(BoletoPresenter, "toPayload")
        .mockReturnValue(undefined as any);

      useCase = new MontarNotificacaoUseCase("uuid", data, mockConfiguracoes);

      const result = useCase.execute({ cnpjCedente: "12345678000190" });

      expect(result).toHaveLength(0);
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining("total=0"),
      );

      spy.mockRestore();
    });
  });
});
