import { BoletoPresenter } from "./boleto";

describe("[WEBHOOK] BoletoPresenter", () => {
  describe("toPayload()", () => {
    it("deve retornar payload com estrutura correta", () => {
      const result = BoletoPresenter.toPayload(
        "http://webhook.com",
        { Authorization: "Bearer token" },
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "LIQUIDADO",
          cnpjCedente: "12.345.678/0001-90",
        },
      );

      expect(result).toHaveProperty("kind", "webhook");
      expect(result).toHaveProperty("method", "POST");
      expect(result).toHaveProperty("url", "http://webhook.com");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("body");
    });

    it("deve incluir URL fornecida", () => {
      const result = BoletoPresenter.toPayload(
        "http://custom-webhook.com/endpoint",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "LIQUIDADO",
          cnpjCedente: "12.345.678/0001-90",
        },
      );

      expect(result.url).toBe("http://custom-webhook.com/endpoint");
    });

    it("deve incluir headers fornecidos", () => {
      const headers = {
        Authorization: "Bearer token123",
        "X-Custom-Header": "value",
      };

      const result = BoletoPresenter.toPayload("http://webhook.com", headers, {
        webhookReprocessadoId: "uuid-123",
        situacao: "LIQUIDADO",
        cnpjCedente: "12.345.678/0001-90",
      });

      expect(result.headers).toEqual(headers);
    });

    it("deve incluir CNPJ do cedente no body", () => {
      const result = BoletoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "LIQUIDADO",
          cnpjCedente: "98.765.432/0001-10",
        },
      );

      expect(result.body.CpfCnpjCedente).toBe("98.765.432/0001-10");
    });

    it("deve incluir situacao no titulo", () => {
      const result = BoletoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "REGISTRADO",
          cnpjCedente: "12.345.678/0001-90",
        },
      );

      expect(result.body.titulo.situacao).toBe("REGISTRADO");
    });

    it("deve incluir webhookReprocessadoId como idintegracao", () => {
      const result = BoletoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-456",
          situacao: "BAIXADO",
          cnpjCedente: "12.345.678/0001-90",
        },
      );

      expect(result.body.titulo.idintegracao).toBe("uuid-456");
    });

    it("deve gerar dataHoraEnvio no formato pt-BR", () => {
      const result = BoletoPresenter.toPayload(
        "http://webhook.com",
        {},
        {
          webhookReprocessadoId: "uuid-123",
          situacao: "LIQUIDADO",
          cnpjCedente: "12.345.678/0001-90",
        },
      );

      expect(result.body.dataHoraEnvio).toBeDefined();
      expect(typeof result.body.dataHoraEnvio).toBe("string");
      expect(result.body.dataHoraEnvio).not.toContain(",");
    });

    it("deve aceitar diferentes situações", () => {
      const situacoes = ["REGISTRADO", "LIQUIDADO", "BAIXADO"];

      situacoes.forEach((situacao) => {
        const result = BoletoPresenter.toPayload(
          "http://webhook.com",
          {},
          {
            webhookReprocessadoId: "uuid-123",
            situacao,
            cnpjCedente: "12.345.678/0001-90",
          },
        );

        expect(result.body.titulo.situacao).toBe(situacao);
      });
    });
  });

  describe("Método estático", () => {
    it("toPayload deve ser um método estático", () => {
      expect(typeof BoletoPresenter.toPayload).toBe("function");
    });
  });
});
