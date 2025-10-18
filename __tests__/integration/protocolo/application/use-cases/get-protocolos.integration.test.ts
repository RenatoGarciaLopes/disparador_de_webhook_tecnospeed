import { GetProtocolosUseCase } from "@/modules/protocolo/application/use-cases/protocolo/GetProtocolosUseCase";
import { WebhookReprocessadoRepository } from "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] GetProtocolosUseCase - Database", () => {
  let useCase: GetProtocolosUseCase;
  let repository: WebhookReprocessadoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new WebhookReprocessadoRepository();
    useCase = new GetProtocolosUseCase(repository);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Busca com filtros de data (query real)", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          data: { test: "protocolo 1" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15T10:00:00Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          data: { test: "protocolo 2" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-20T10:00:00Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          data: { test: "protocolo 3" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["3"],
          product: "pix",
          data_criacao: new Date("2025-01-25T10:00:00Z"),
        },
      ] as any[]);
    });

    it("deve buscar protocolos no intervalo de datas (query real)", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
        },
        1,
      );

      expect(result).toHaveLength(3);
      expect(result.every((r) => r instanceof WebhookReprocessado)).toBe(true);
    });

    it("deve filtrar por produto específico", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          product: "boleto",
        },
        1,
      );

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.product === "boleto")).toBe(true);
    });

    it("deve filtrar por servico_id específico", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          id: ["1"],
        },
        1,
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((r) => r.servico_id.includes("1"))).toBe(true);
    });

    it("deve filtrar por kind", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          kind: "webhook",
        },
        1,
      );

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.kind === "webhook")).toBe(true);
    });

    it("deve filtrar por type", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          type: "DISPONIVEL",
        },
        1,
      );

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.type === "DISPONIVEL")).toBe(true);
    });

    it("deve retornar array vazio para intervalo sem protocolos", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2026-01-01"),
          end_date: new Date("2026-01-31"),
        },
        1,
      );

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Filtros combinados", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440010",
          data: { test: "boleto webhook disponivel" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          data: { test: "boleto webhook liquidated" },
          cedente_id: 1,
          kind: "webhook",
          type: "LIQUIDATED",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-16"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440012",
          data: { test: "pix webhook disponivel" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["3"],
          product: "pix",
          data_criacao: new Date("2025-01-17"),
        },
      ] as any[]);
    });

    it("deve combinar filtros de produto e tipo", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          product: "boleto",
          type: "DISPONIVEL",
        },
        1,
      );

      expect(result).toHaveLength(1);
      expect(result[0].product).toBe("boleto");
      expect(result[0].type).toBe("DISPONIVEL");
    });

    it("deve combinar múltiplos filtros simultaneamente", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          product: "boleto",
          kind: "webhook",
          type: "DISPONIVEL",
          id: ["1"],
        },
        1,
      );

      expect(result).toHaveLength(1);
      expect(result[0].product).toBe("boleto");
      expect(result[0].kind).toBe("webhook");
      expect(result[0].type).toBe("DISPONIVEL");
    });
  });

  describe("Isolamento entre cedentes", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440020",
          data: { cedente: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440021",
          data: { cedente: 2 },
          cedente_id: 2,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440022",
          data: { cedente: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["3"],
          product: "pix",
          data_criacao: new Date("2025-01-15"),
        },
      ] as any[]);
    });

    it("deve retornar apenas protocolos do cedente especificado", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
        },
        1,
      );

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.cedente_id === 1)).toBe(true);
    });

    it("deve retornar vazio para cedente sem protocolos", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
        },
        999,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("Validação de intervalo de datas", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440030",
          data: { date: "jan 10" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-10T12:00:00Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440031",
          data: { date: "jan 20" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date("2025-01-20T12:00:00Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440032",
          data: { date: "jan 30" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["3"],
          product: "boleto",
          data_criacao: new Date("2025-01-30T12:00:00Z"),
        },
      ] as any[]);
    });

    it("deve incluir protocolos na data inicial do intervalo", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-10T00:00:00Z"),
          end_date: new Date("2025-01-31T23:59:59Z"),
        },
        1,
      );

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("deve incluir protocolos na data final do intervalo", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01T00:00:00Z"),
          end_date: new Date("2025-01-30T23:59:59Z"),
        },
        1,
      );

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("deve filtrar corretamente intervalo restrito", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-15T00:00:00Z"),
          end_date: new Date("2025-01-25T23:59:59Z"),
        },
        1,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("550e8400-e29b-41d4-a716-446655440031");
    });
  });

  describe("Busca com múltiplos servico_ids", () => {
    beforeEach(async () => {
      await WebhookReprocessado.bulkCreate([
        {
          id: "550e8400-e29b-41d4-a716-446655440040",
          data: { services: "1 only" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440041",
          data: { services: "1,2,3" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1", "2", "3"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440042",
          data: { services: "4,5" },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["4", "5"],
          product: "boleto",
          data_criacao: new Date("2025-01-15"),
        },
      ] as any[]);
    });

    it("deve buscar protocolos que contenham pelo menos um dos IDs", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          id: ["1"],
        },
        1,
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("deve buscar protocolos com múltiplos servico_ids especificados", async () => {
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          id: ["4", "5"],
        },
        1,
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Performance", () => {
    it("deve buscar grande quantidade de protocolos eficientemente", async () => {
      // Criar 50 protocolos
      const protocolos = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
          data: { index: i },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: [String(i)],
          product: "boleto",
          data_criacao: new Date(`2025-01-${(i % 28) + 1}`),
        }));

      await WebhookReprocessado.bulkCreate(protocolos as any[]);

      const startTime = Date.now();
      const result = await useCase.execute(
        {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
        },
        1,
      );
      const endTime = Date.now();

      expect(result.length).toBeGreaterThanOrEqual(50);
      expect(endTime - startTime).toBeLessThan(5000); // Menos de 5 segundos
    });
  });
});
