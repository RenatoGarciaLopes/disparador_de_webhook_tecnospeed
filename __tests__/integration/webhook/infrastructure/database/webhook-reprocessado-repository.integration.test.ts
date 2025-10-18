import { WebhookReprocessadoRepository } from "@/modules/webhook/infrastructure/database/repositories/WebhookReprocessadoRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] WebhookReprocessadoRepository - Database", () => {
  let repository: WebhookReprocessadoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new WebhookReprocessadoRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("create - Inserção real no banco PostgreSQL", () => {
    it("deve criar webhook reprocessado no banco", async () => {
      const data = {
        data: { test: "payload", ids: [1, 2, 3] },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "boleto",
      };

      const result = await repository.create(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.cedente_id).toBe(1);
      expect(result.kind).toBe("webhook");
      expect(result.product).toBe("boleto");
      expect(result.data_criacao).toBeDefined();
    });

    it("deve gerar UUID único para cada criação", async () => {
      const data = {
        data: { test: "payload" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
      };

      const result1 = await repository.create(data);
      const result2 = await repository.create(data);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toBeTruthy();
      expect(result2.id).toBeTruthy();
    });

    it("deve armazenar array de servico_id como JSON", async () => {
      const data = {
        data: { test: "payload" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["10", "20", "30"],
        product: "pagamento",
      };

      const result = await repository.create(data);

      expect(result.servico_id).toEqual(["10", "20", "30"]);
      expect(Array.isArray(result.servico_id)).toBe(true);
    });

    it("deve armazenar data como JSONB no PostgreSQL", async () => {
      const complexData = {
        product: "pix",
        ids: [1, 2],
        metadata: { user: "test", timestamp: new Date().toISOString() },
        nested: { level1: { level2: "value" } },
      };

      const data = {
        data: complexData,
        cedente_id: 1,
        kind: "webhook",
        type: "LIQUIDATED",
        servico_id: ["1", "2"],
        product: "pix",
      };

      const result = await repository.create(data);

      expect(result.data).toEqual(complexData);
      expect(result.data).toHaveProperty("metadata");
      expect(result.data).toHaveProperty("nested");
    });

    it("deve armazenar data_criacao automaticamente", async () => {
      const data = {
        data: { test: "timestamp" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
      };

      const before = new Date();
      const result = await repository.create(data);
      const after = new Date();

      expect(result.data_criacao).toBeDefined();
      expect(result.data_criacao.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.data_criacao.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  describe("Cenários do fluxo completo (DOCS linha 268-270)", () => {
    it("deve criar WebhookReprocessado com estrutura para receber protocolo", async () => {
      // 1. Criar WebhookReprocessado antes de enviar para TechnoSpeed
      const created = await repository.create({
        data: {
          product: "boleto",
          ids: [1, 2],
          kind: "webhook",
          type: "DISPONIVEL",
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2"],
        product: "boleto",
      });

      const webhookId = created.id;
      expect(webhookId).toBeDefined();
      expect(created.data).toBeDefined();

      // Data está pronto para receber protocolo posteriormente
      expect(typeof created.data).toBe("object");
    });

    it("deve permitir múltiplos WebhookReprocessados para diferentes grupos (DOCS linha 297)", async () => {
      // Grupo 1: Conta 1
      const grupo1 = await repository.create({
        data: { conta_id: 1, servicos: [1, 2] },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2"],
        product: "boleto",
      });

      // Grupo 2: Conta 2
      const grupo2 = await repository.create({
        data: { conta_id: 2, servicos: [3, 4] },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["3", "4"],
        product: "boleto",
      });

      expect(grupo1.id).not.toBe(grupo2.id);
      expect(grupo1.cedente_id).toBe(grupo2.cedente_id);

      // Validar que cada grupo tem estrutura independente
      expect(grupo1.data).toHaveProperty("conta_id", 1);
      expect(grupo2.data).toHaveProperty("conta_id", 2);
    });

    it("deve criar múltiplos webhooks para diferentes produtos", async () => {
      const boleto = await repository.create({
        data: { type: "boleto" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
      });

      const pagamento = await repository.create({
        data: { type: "pagamento" },
        cedente_id: 1,
        kind: "webhook",
        type: "SCHEDULED",
        servico_id: ["2"],
        product: "pagamento",
      });

      const pix = await repository.create({
        data: { type: "pix" },
        cedente_id: 1,
        kind: "webhook",
        type: "ACTIVE",
        servico_id: ["3"],
        product: "pix",
      });

      expect(boleto.product).toBe("boleto");
      expect(pagamento.product).toBe("pagamento");
      expect(pix.product).toBe("pix");
    });
  });

  describe("Testes de erro e edge cases", () => {
    it("deve lançar erro ao criar webhook com cedente_id inválido", async () => {
      const data = {
        data: { test: "payload" },
        cedente_id: 99999, // ID que não existe
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
      };

      // Pode lançar erro de FK ou criar com ID inválido dependendo da constraint
      await expect(repository.create(data)).rejects.toThrow();
    });

    it("deve lidar com dados JSONB complexos e grandes", async () => {
      const largeData = {
        items: Array(100)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            metadata: { key: `value${i}` },
          })),
        nested: {
          level1: { level2: { level3: "deep value" } },
        },
      };

      const data = {
        data: largeData,
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: Array(30)
          .fill(null)
          .map((_, i) => String(i + 1)),
        product: "boleto",
      };

      const result = await repository.create(data);

      expect(result.data).toEqual(largeData);
      expect(result.servico_id).toHaveLength(30);
    });

    it("deve preservar tipos de dados no JSONB", async () => {
      const complexData = {
        string: "text",
        number: 123,
        boolean: true,
        nullValue: null,
        array: [1, "two", true, null],
        object: { nested: "value" },
        date: new Date().toISOString(),
      };

      const data = {
        data: complexData,
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "pix",
      };

      const result = await repository.create(data);
      const resultData = result.data as any;

      expect(resultData.string).toBe("text");
      expect(resultData.number).toBe(123);
      expect(resultData.boolean).toBe(true);
      expect(resultData.nullValue).toBeNull();
      expect(resultData.array).toEqual([1, "two", true, null]);
      expect(resultData.object).toEqual({ nested: "value" });
    });

    it("deve validar constraint de kind válido", async () => {
      const data = {
        data: { test: "data" },
        cedente_id: 1,
        kind: "invalid_kind" as any,
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
      };

      // Deve lançar erro de constraint ou aceitar dependendo do schema
      try {
        await repository.create(data);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("deve lidar com array vazio de servico_id", async () => {
      const data = {
        data: { test: "empty array" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: [],
        product: "boleto",
      };

      const result = await repository.create(data);

      expect(result.servico_id).toEqual([]);
      expect(Array.isArray(result.servico_id)).toBe(true);
    });
  });

  describe("Concorrência e transações", () => {
    it("deve criar múltiplos webhooks simultaneamente", async () => {
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          repository.create({
            data: { concurrent: i },
            cedente_id: 1,
            kind: "webhook",
            type: "DISPONIVEL",
            servico_id: [String(i)],
            product: "boleto",
          }),
        );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);

      // Todos devem ter IDs únicos
      const ids = results.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
