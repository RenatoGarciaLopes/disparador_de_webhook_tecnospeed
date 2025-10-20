import { PixPresenter } from "./pix";

describe("[WEBHOOK] PixPresenter", () => {
  describe("toPayload()", () => {
    it("deve retornar payload com estrutura correta", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        { Authorization: "Bearer token" },
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "LIQUIDATED",
          cedenteId: 1,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result).toHaveProperty("kind", "webhook");
      expect(result).toHaveProperty("method", "POST");
      expect(result).toHaveProperty("url", "http://webhook.com");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("body");
    });

    it("deve incluir URL fornecida", () => {
      const result = PixPresenter.toPayload(
        "http://pix-webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "ACTIVE",
          cedenteId: 1,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result.url).toBe("http://pix-webhook.com");
    });

    it("deve incluir headers fornecidos", () => {
      const headers = {
        "X-PIX-Key": "pix-key",
        "Content-Type": "application/json",
      };

      const result = PixPresenter.toPayload("http://webhook.com", headers, {
        webhookReprocessadoId: "uuid-123",
        situacao: "ACTIVE",
        cedenteId: 1,
        contaId: 20,
        servicoId: 10,
      });

      expect(result.headers).toEqual(headers);
    });

    it("deve incluir companyId no body", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "ACTIVE",
          cedenteId: 99,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result.body.companyId).toBe(99);
    });

    it("deve incluir event com situacao no body", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "REJECTED",
          cedenteId: 1,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result.body.event).toBe("REJECTED");
    });

    it("deve incluir transactionId no body", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-789",
          situacao: "ACTIVE",
          cedenteId: 1,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result.body.transactionId).toBe("uuid-789");
    });

    it("deve incluir tags com contaId, 'pix' e ano atual", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "ACTIVE",
          cedenteId: 1,
          contaId: 50,
          servicoId: 10,
        },
      );

      expect(result.body.tags).toHaveLength(3);
      expect(result.body.tags[0]).toBe(50);
      expect(result.body.tags[1]).toBe("pix");
      expect(result.body.tags[2]).toBe(new Date().getFullYear().toString());
    });

    it("deve incluir pixId convertido para string no id", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "ACTIVE",
          cedenteId: 1,
          contaId: 20,
          servicoId: 123,
        },
      );

      expect(result.body.id.pixId).toBe("123");
      expect(typeof result.body.id.pixId).toBe("string");
    });

    it("deve incluir type vazio no body", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "ACTIVE",
          cedenteId: 1,
          contaId: 20,
          servicoId: 10,
        },
      );

      expect(result.body.type).toBe("");
    });

    it("deve aceitar diferentes situações", () => {
      const situacoes = ["ACTIVE", "LIQUIDATED", "REJECTED"];

      situacoes.forEach((situacao) => {
        const result = PixPresenter.toPayload(
          "http://webhook.com",
          {},
          {
            webhookReprocessadoId: "uuid-123",
            situacao,
            cedenteId: 1,
            contaId: 20,
            servicoId: 10,
          },
        );

        expect(result.body.event).toBe(situacao);
      });
    });

    it("deve aceitar diferentes IDs", () => {
      const result = PixPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-999",
          situacao: "ACTIVE",
          cedenteId: 777,
          contaId: 888,
          servicoId: 999,
        },
      );

      expect(result.body.companyId).toBe(777);
      expect(result.body.tags[0]).toBe(888);
      expect(result.body.id.pixId).toBe("999");
    });
  });

  describe("Método estático", () => {
    it("toPayload deve ser um método estático", () => {
      expect(typeof PixPresenter.toPayload).toBe("function");
    });
  });
});
