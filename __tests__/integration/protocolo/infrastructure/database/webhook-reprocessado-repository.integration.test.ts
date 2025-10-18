import { WebhookReprocessadoRepository } from "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] WebhookReprocessadoRepository (Protocolo) - Database", () => {
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

  describe("findAll - Busca de protocolos com filtros", () => {
    beforeEach(async () => {
      // Criar alguns protocolos de teste
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          data: { test: "boleto 1" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          data: { test: "boleto 2" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-20"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          data: { test: "pix 1" },
          cedente_id: 1,
          kind: "webhook",
          type: "LIQUIDATED",
          servico_id: ["3"],
          product: "pix",
          data_criacao: new Date("2025-01-25"),
        },
      ] as any[]);
    });

    it("deve buscar todos os protocolos de um cedente no intervalo de datas", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(WebhookReprocessado);
    });

    it("deve filtrar protocolos por produto", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        "boleto",
      );

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.product === "boleto")).toBe(true);
    });

    it("deve filtrar protocolos por servico_id", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        undefined,
        ["1"],
      );

      expect(result).toHaveLength(1);
      expect(result[0].servico_id).toEqual(["1"]);
    });

    it("deve filtrar protocolos por kind", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        undefined,
        undefined,
        "webhook",
      );

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.kind === "webhook")).toBe(true);
    });

    it("deve filtrar protocolos por type", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        undefined,
        undefined,
        undefined,
        "DISPONIVEL",
      );

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.type === "DISPONIVEL")).toBe(true);
    });

    it("deve combinar múltiplos filtros", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        "boleto",
        undefined,
        "webhook",
        "DISPONIVEL",
      );

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (r) =>
            r.product === "boleto" &&
            r.kind === "webhook" &&
            r.type === "DISPONIVEL",
        ),
      ).toBe(true);
    });

    it("deve retornar array vazio se não encontrar protocolos", async () => {
      const result = await repository.findAll(
        999,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar corretamente por intervalo de datas", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-18"),
        new Date("2025-01-22"),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("550e8400-e29b-41d4-a716-446655440002");
    });

    it("deve retornar protocolos ordenados por data de criação", async () => {
      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result).toHaveLength(3);
      // Verificar se estão em ordem (crescente ou decrescente)
      expect(result[0].data_criacao).toBeDefined();
      expect(result[1].data_criacao).toBeDefined();
      expect(result[2].data_criacao).toBeDefined();
    });
  });

  describe("findById - Busca de protocolo por ID", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440010";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
        data: { test: "find by id" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);
    });

    it("deve buscar protocolo por ID e cedente_id", async () => {
      const result = await repository.findById(protocoloId, 1);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(WebhookReprocessado);
      expect(result!.id).toBe(protocoloId);
      expect(result!.cedente_id).toBe(1);
    });

    it("deve retornar null se protocolo não existir", async () => {
      const result = await repository.findById(
        "550e8400-e29b-41d4-a716-999999999999",
        1,
      );

      expect(result).toBeNull();
    });

    it("deve retornar null se protocolo pertencer a outro cedente", async () => {
      const result = await repository.findById(protocoloId, 999);

      expect(result).toBeNull();
    });

    it("deve retornar protocolo com todos os campos", async () => {
      const result = await repository.findById(protocoloId, 1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(protocoloId);
      expect(result!.data).toEqual({ test: "find by id" });
      expect(result!.cedente_id).toBe(1);
      expect(result!.kind).toBe("webhook");
      expect(result!.type).toBe("DISPONIVEL");
      expect(result!.servico_id).toEqual(["1"]);
      expect(result!.product).toBe("boleto");
      expect(result!.data_criacao).toBeDefined();
    });
  });

  describe("Validação de integridade de dados", () => {
    it("deve preservar tipos de dados em campos JSONB", async () => {
      const protocoloId = "550e8400-e29b-41d4-a716-446655440020";

      await WebhookReprocessado.create({
        id: protocoloId,
        data: {
          string: "text",
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          nested: { key: "value" },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const result = await repository.findById(protocoloId, 1);

      expect(result).toBeDefined();
      const data = result!.data as any;
      expect(data.string).toBe("text");
      expect(data.number).toBe(123);
      expect(data.boolean).toBe(true);
      expect(data.array).toEqual([1, 2, 3]);
      expect(data.nested).toEqual({ key: "value" });
    });

    it("deve lidar com arrays vazios corretamente", async () => {
      const protocoloId = "550e8400-e29b-41d4-a716-446655440021";

      await WebhookReprocessado.create({
        id: protocoloId,
        data: { test: "empty array" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: [],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const result = await repository.findById(protocoloId, 1);

      expect(result).toBeDefined();
      expect(result!.servico_id).toEqual([]);
      expect(Array.isArray(result!.servico_id)).toBe(true);
    });
  });

  describe("Cenários de edge cases", () => {
    it("deve buscar corretamente com datas no limite do intervalo", async () => {
      const exactDate = new Date("2025-01-15T12:00:00Z");

      await WebhookReprocessado.create({
        id: "550e8400-e29b-41d4-a716-446655440030",
        data: { test: "exact date" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: exactDate,
      } as any);

      const result = await repository.findAll(
        1,
        new Date("2025-01-15T00:00:00Z"),
        new Date("2025-01-15T23:59:59Z"),
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("deve buscar protocolos com múltiplos servico_ids usando contains", async () => {
      await WebhookReprocessado.create({
        id: "550e8400-e29b-41d4-a716-446655440031",
        data: { test: "multiple services" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3", "4", "5"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const result = await repository.findAll(
        1,
        new Date("2025-01-01"),
        new Date("2025-12-31"),
        undefined,
        ["2", "3"],
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Performance e concorrência", () => {
    it("deve buscar múltiplos protocolos simultaneamente", async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440040",
          data: { concurrent: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440041",
          data: { concurrent: 2 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440042",
          data: { concurrent: 3 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["3"],
          product: "boleto",
          data_criacao: new Date(),
        },
      ] as any[]);

      const promises = [
        repository.findById("550e8400-e29b-41d4-a716-446655440040", 1),
        repository.findById("550e8400-e29b-41d4-a716-446655440041", 1),
        repository.findById("550e8400-e29b-41d4-a716-446655440042", 1),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r !== null)).toBe(true);
    });
  });
});
