import { PagamentoPresenter } from "./pagamento";

describe("[WEBHOOK] PagamentoPresenter", () => {
  describe("toPayload()", () => {
    it("deve retornar payload com estrutura correta", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        { Authorization: "Bearer token" },
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result).toHaveProperty("kind", "webhook");
      expect(result).toHaveProperty("method", "POST");
      expect(result).toHaveProperty("url", "http://webhook.com");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("body");
    });

    it("deve incluir URL fornecida", () => {
      const result = PagamentoPresenter.toPayload(
        "http://payment-webhook.com",
        {},
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result.url).toBe("http://payment-webhook.com");
    });

    it("deve incluir headers fornecidos", () => {
      const headers = {
        "X-API-Key": "secret-key",
        "Content-Type": "application/json",
      };

      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        headers,
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result.headers).toEqual(headers);
    });

    it("deve incluir status no body", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          situacao: "CANCELLED",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result.body.status).toBe("CANCELLED");
    });

    it("deve incluir uniqueid no body", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-456",
          contaId: 100,
        },
      );

      expect(result.body.uniqueid).toBe("uuid-456");
    });

    it("deve incluir accountHash com contaId", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 999,
        },
      );

      expect(result.body.accountHash).toBe(999);
    });

    it("deve gerar createdAt no formato ISO", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result.body.createdAt).toBeDefined();
      expect(typeof result.body.createdAt).toBe("string");
      expect(result.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("deve incluir arrays vazios para ocurrences e occurrences", () => {
      const result = PagamentoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          situacao: "PAID",
          webhookReprocessadoId: "uuid-123",
          contaId: 100,
        },
      );

      expect(result.body.ocurrences).toEqual([]);
      expect(result.body.occurrences).toEqual([]);
    });

    it("deve aceitar diferentes situações", () => {
      const situacoes = ["PAID", "CANCELLED", "SCHEDULED"];

      situacoes.forEach((situacao) => {
        const result = PagamentoPresenter.toPayload(
          "http://webhook.com",
          {},
          {
            situacao,
            webhookReprocessadoId: "uuid-123",
            contaId: 100,
          },
        );

        expect(result.body.status).toBe(situacao);
      });
    });
  });

  describe("Método estático", () => {
    it("toPayload deve ser um método estático", () => {
      expect(typeof PagamentoPresenter.toPayload).toBe("function");
    });
  });
});
