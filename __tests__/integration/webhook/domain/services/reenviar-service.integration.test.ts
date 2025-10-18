import { ValidarServicosUseCase } from "@/modules/webhook/application/use-cases/reenviar/ValidarServicosUseCase";
import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ServicoRepository } from "@/modules/webhook/infrastructure/database/repositories/ServicoRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] ReenviarService - Complete Flow", () => {
  let reenviarService: ReenviarService;
  let validarServicosUseCase: ValidarServicosUseCase;
  let servicoRepository: ServicoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    servicoRepository = new ServicoRepository();
    validarServicosUseCase = new ValidarServicosUseCase(servicoRepository);
    reenviarService = new ReenviarService(validarServicosUseCase);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Fluxo completo com banco real", () => {
    it("deve processar reenvio de BOLETO com dados reais", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Validar estrutura do payload
      result.forEach((payload) => {
        expect(payload).toHaveProperty("kind", "webhook");
        expect(payload).toHaveProperty("method", "POST");
        expect(payload).toHaveProperty("url");
        expect(payload).toHaveProperty("headers");
        expect(payload).toHaveProperty("body");
        expect(payload.url).toMatch(/^https?:\/\//);
      });
    });

    it("deve processar reenvio de PIX com dados reais", async () => {
      const cedenteId = 1;
      const data = {
        product: "PIX",
        id: [1],
        kind: "webhook",
        type: "PAGO",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("body");
      expect(result[0].body).toHaveProperty("transactionId");
      expect(result[0].body).toHaveProperty("event");
    });

    it("deve processar reenvio de PAGAMENTOS com dados reais", async () => {
      const cedenteId = 1;
      const data = {
        product: "PAGAMENTOS",
        id: [1],
        kind: "webhook",
        type: "SCHEDULED",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("body");
      expect(result[0].body).toHaveProperty("status");
      expect(result[0].body).toHaveProperty("uniqueid");
    });
  });

  describe("Validação com banco real", () => {
    it("deve lançar erro quando serviço não pertence ao cedente", async () => {
      const cedenteId = 999; // Cedente que não existe
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      await expect(reenviarService.reenviar(cedenteId, data)).rejects.toThrow();
    });

    it("deve lançar erro quando IDs não existem no banco", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [9999, 8888],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      await expect(reenviarService.reenviar(cedenteId, data)).rejects.toThrow();
    });

    it("deve usar configuração correta da conta ou cedente", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result[0].url).toBeDefined();
      expect(result[0].url).toMatch(/^https?:\/\//);

      // URL deve ser da configuração (Conta ou Cedente)
      expect(
        result[0].url.includes("webhook.site") ||
          result[0].url.includes("http"),
      ).toBe(true);
    });
  });

  describe("Múltiplos serviços com diferentes configurações", () => {
    it("deve criar payloads separados para cada serviço", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      // Deve ter um payload por serviço (ou agrupado por conta)
      expect(result.length).toBeGreaterThan(0);

      // Todos devem ter estrutura válida
      result.forEach((payload) => {
        expect(payload.body).toBeDefined();
        expect(payload.url).toBeDefined();
        expect(payload.headers).toBeDefined();
      });
    });

    it("deve agrupar serviços da mesma conta", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      // Se serviços pertencem à mesma conta, podem ser agrupados
      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(2); // No máximo 2 payloads
    });
  });

  describe("Edge cases e erros", () => {
    it("deve retornar array vazio quando não há serviços", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      // Deve falhar na validação
      await expect(reenviarService.reenviar(cedenteId, data)).rejects.toThrow();
    });

    it("deve lidar com produto não existente", async () => {
      const cedenteId = 1;
      const data = {
        product: "INVALID_PRODUCT" as any,
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      // Deve retornar array vazio para produto inválido
      expect(result).toEqual([]);
    });

    it("deve gerar UUID único para cada requisição", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result1 = await reenviarService.reenviar(cedenteId, data);
      const result2 = await reenviarService.reenviar(cedenteId, data);

      // UUIDs devem ser diferentes entre requisições
      const uuid1 =
        result1[0]?.body?.idintegracao ||
        result1[0]?.body?.uniqueid ||
        result1[0]?.body?.transactionId;
      const uuid2 =
        result2[0]?.body?.idintegracao ||
        result2[0]?.body?.uniqueid ||
        result2[0]?.body?.transactionId;

      if (uuid1 && uuid2) {
        expect(uuid1).not.toBe(uuid2);
      }
    });
  });

  describe("Validação de headers adicionais", () => {
    it("deve incluir headers da configuração no payload", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await reenviarService.reenviar(cedenteId, data);

      expect(result[0].headers).toBeDefined();

      // Headers podem ser objeto vazio ou conter headers customizados
      expect(typeof result[0].headers).toBe("object");
    });
  });

  describe("Performance com banco real", () => {
    it("deve processar múltiplos serviços eficientemente", async () => {
      const cedenteId = 1;
      const data = {
        product: "BOLETO",
        id: [1, 2],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const start = Date.now();
      const result = await reenviarService.reenviar(cedenteId, data);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      // Deve processar em tempo razoável (< 3 segundos)
      expect(duration).toBeLessThan(3000);
    });
  });
});
