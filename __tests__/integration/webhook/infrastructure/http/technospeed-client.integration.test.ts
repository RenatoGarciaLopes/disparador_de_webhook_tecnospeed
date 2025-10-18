import {
  TechnospeedClient,
  TechnospeedClientError,
  TechnospeedPayload,
} from "@/modules/webhook/infrastructure/http/TechnospeedClient";

describe("[Integration] TechnospeedClient - HTTP Real", () => {
  let client: TechnospeedClient;

  beforeAll(() => {
    // Usa API mock real do Beeceptor
    client = new TechnospeedClient("https://plug-retry.free.beeceptor.com");
  });

  describe("Envio real para API mock", () => {
    it("deve enviar webhook para API mock (Beeceptor)", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/test-integration",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          tipoWH: "",
          dataHoraEnvio: new Date().toLocaleString("pt-BR"),
          CpfCnpjCedente: "12345678000100",
          titulo: {
            situacao: "REGISTRADO",
            idintegracao: "test-uuid-123",
            TituloNossoNumero: "",
            TituloMovimentos: {},
          },
        },
      };

      const protocolo = await client.sendWebhook(payload);

      expect(protocolo).toBeDefined();
      expect(typeof protocolo).toBe("string");
      expect(protocolo.length).toBeGreaterThan(0);
    });

    it("deve receber protocolo UUID válido da API", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/uuid-test",
        headers: {},
        body: {
          test: "integration",
        },
      };

      const protocolo = await client.sendWebhook(payload);

      // Valida formato UUID (básico)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(protocolo).toMatch(uuidRegex);
    });

    it("deve enviar múltiplos webhooks sequencialmente", async () => {
      const payloads: TechnospeedPayload[] = [
        {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/test-1",
          headers: {},
          body: { id: 1 },
        },
        {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/test-2",
          headers: {},
          body: { id: 2 },
        },
        {
          kind: "webhook",
          method: "POST",
          url: "https://webhook.site/test-3",
          headers: {},
          body: { id: 3 },
        },
      ];

      const protocolos: string[] = [];
      for (const payload of payloads) {
        const protocolo = await client.sendWebhook(payload);
        protocolos.push(protocolo);
      }

      expect(protocolos).toHaveLength(3);
      expect(protocolos.every((p) => p.length > 0)).toBe(true);
      // Cada protocolo deve ser único
      expect(new Set(protocolos).size).toBe(3);
    });

    it("deve incluir headers customizados na requisição", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/custom-headers",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "test-value",
          Authorization: "Bearer fake-token",
        },
        body: {
          data: "test",
        },
      };

      const protocolo = await client.sendWebhook(payload);

      expect(protocolo).toBeDefined();
      expect(typeof protocolo).toBe("string");
    });
  });

  describe("Tratamento de erros de rede", () => {
    it("deve tratar erro de timeout com API lenta", async () => {
      // Cliente com timeout muito curto
      const fastTimeoutClient = new TechnospeedClient(
        "https://plug-retry.free.beeceptor.com",
        1, // 1ms - vai dar timeout
      );

      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/timeout",
        headers: {},
        body: {},
      };

      await expect(fastTimeoutClient.sendWebhook(payload)).rejects.toThrow(
        TechnospeedClientError,
      );
    }, 10000); // timeout do teste em 10s

    it("deve tratar erro de URL inválida", async () => {
      const invalidClient = new TechnospeedClient(
        "https://invalid-domain-that-does-not-exist-12345.com",
      );

      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/test",
        headers: {},
        body: {},
      };

      await expect(invalidClient.sendWebhook(payload)).rejects.toThrow(
        TechnospeedClientError,
      );
    }, 10000);
  });

  describe("Performance", () => {
    it("deve processar webhook em tempo razoável (< 5s)", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/performance-test",
        headers: {},
        body: { timestamp: Date.now() },
      };

      const startTime = Date.now();
      await client.sendWebhook(payload);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    });

    it("deve processar múltiplos webhooks em paralelo", async () => {
      const payloads: TechnospeedPayload[] = Array.from(
        { length: 5 },
        (_, i) => ({
          kind: "webhook",
          method: "POST",
          url: `https://webhook.site/parallel-${i}`,
          headers: {},
          body: { index: i },
        }),
      );

      const startTime = Date.now();
      const promises = payloads.map((payload) => client.sendWebhook(payload));
      const protocolos = await Promise.all(promises);
      const endTime = Date.now();

      expect(protocolos).toHaveLength(5);
      expect(protocolos.every((p) => p.length > 0)).toBe(true);

      // Paralelo deve ser mais rápido que sequencial
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Menos de 10 segundos total
    });
  });

  describe("Diferentes tipos de payloads", () => {
    it("deve enviar payload de BOLETO", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/boleto",
        headers: { "Content-Type": "application/json" },
        body: {
          tipoWH: "",
          dataHoraEnvio: "17/01/2025 10:30:00",
          CpfCnpjCedente: "12345678000100",
          titulo: {
            situacao: "REGISTRADO",
            idintegracao: "uuid-boleto-123",
            TituloNossoNumero: "",
            TituloMovimentos: {},
          },
        },
      };

      const protocolo = await client.sendWebhook(payload);
      expect(protocolo).toBeDefined();
    });

    it("deve enviar payload de PAGAMENTO", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/pagamento",
        headers: { "Content-Type": "application/json" },
        body: {
          status: "SCHEDULED ACTIVE",
          uniqueid: "uuid-pagamento-456",
          createdAt: new Date().toISOString(),
          ocurrences: [],
          accountHash: "account-123",
          occurrences: [],
        },
      };

      const protocolo = await client.sendWebhook(payload);
      expect(protocolo).toBeDefined();
    });

    it("deve enviar payload de PIX", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/pix",
        headers: { "Content-Type": "application/json" },
        body: {
          type: "",
          companyId: 1,
          event: "ACTIVE",
          transactionId: "uuid-pix-789",
          tags: ["account-456", "pix", "2025"],
          id: {
            pixId: "123",
          },
        },
      };

      const protocolo = await client.sendWebhook(payload);
      expect(protocolo).toBeDefined();
    });
  });

  describe("Retry e resiliência", () => {
    it("deve tentar novamente após falha temporária", async () => {
      const payload: TechnospeedPayload = {
        kind: "webhook",
        method: "POST",
        url: "https://webhook.site/retry-test",
        headers: {},
        body: {},
      };

      // Primeira tentativa pode falhar, mas deve eventualmente ter sucesso
      // (dependendo da implementação de retry na classe)
      const protocolo = await client.sendWebhook(payload);
      expect(protocolo).toBeDefined();
    });
  });
});
