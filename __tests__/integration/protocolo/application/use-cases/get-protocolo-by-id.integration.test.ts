import { GetProtocoloByIdUseCase } from "@/modules/protocolo/application/use-cases/protocolo/GetProtocoloByIdUseCase";
import { WebhookReprocessadoRepository } from "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository";
import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { DatabaseHelper } from "../../../../helpers/database.helper";

describe("[Integration] GetProtocoloByIdUseCase - Database", () => {
  let useCase: GetProtocoloByIdUseCase;
  let repository: WebhookReprocessadoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new WebhookReprocessadoRepository();
    useCase = new GetProtocoloByIdUseCase(repository);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Busca por ID com dados reais do banco", () => {
    const protocoloId = "550e8400-e29b-41d4-a716-446655440001";

    beforeEach(async () => {
      await WebhookReprocessado.create({
        id: protocoloId,
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
        data_criacao: new Date(),
      } as any);
    });

    it("deve buscar protocolo existente por ID (query real)", async () => {
      const result = await useCase.execute({ id: protocoloId }, 1);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(WebhookReprocessado);
      expect(result!.id).toBe(protocoloId);
      expect(result!.cedente_id).toBe(1);
    });

    it("deve retornar null para protocolo não existente", async () => {
      const result = await useCase.execute(
        { id: "550e8400-e29b-41d4-a716-999999999999" },
        1,
      );

      expect(result).toBeNull();
    });

    it("deve retornar null se protocolo pertencer a outro cedente", async () => {
      const result = await useCase.execute({ id: protocoloId }, 999);

      expect(result).toBeNull();
    });

    it("deve retornar protocolo com estrutura completa de dados", async () => {
      const result = await useCase.execute({ id: protocoloId }, 1);

      expect(result).toBeDefined();
      expect(result!.data).toBeDefined();
      expect(result!.kind).toBe("webhook");
      expect(result!.type).toBe("DISPONIVEL");
      expect(result!.servico_id).toEqual(["1", "2"]);
      expect(result!.product).toBe("boleto");
      expect(result!.data_criacao).toBeDefined();
    });
  });

  describe("Validações de segurança e isolamento", () => {
    it("deve garantir isolamento entre cedentes diferentes", async () => {
      const protocolo1Id = "550e8400-e29b-41d4-a716-446655440010";
      const protocolo2Id = "550e8400-e29b-41d4-a716-446655440011";

      // Criar protocolos para cedentes diferentes
      await WebhookReprocessado.bulkCreate([
        {
          id: protocolo1Id,
          data: { cedente: 1 },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["1"],
          product: "boleto",
          data_criacao: new Date(),
        },
        {
          id: protocolo2Id,
          data: { cedente: 2 },
          cedente_id: 2,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: ["2"],
          product: "boleto",
          data_criacao: new Date(),
        },
      ] as any[]);

      // Cedente 1 deve acessar apenas seu próprio protocolo
      const result1 = await useCase.execute({ id: protocolo1Id }, 1);
      expect(result1).toBeDefined();
      expect(result1!.cedente_id).toBe(1);

      // Cedente 1 NÃO deve acessar protocolo do Cedente 2
      const result2 = await useCase.execute({ id: protocolo2Id }, 1);
      expect(result2).toBeNull();
    });
  });

  describe("Tipos de dados e formatos", () => {
    it("deve buscar protocolo com diferentes tipos de produtos", async () => {
      const protocoloId = "550e8400-e29b-41d4-a716-446655440020";

      await WebhookReprocessado.create({
        id: protocoloId,
        data: { type: "pix" },
        cedente_id: 1,
        kind: "webhook",
        type: "LIQUIDATED",
        servico_id: ["1"],
        product: "pix",
        data_criacao: new Date(),
      } as any);

      const result = await useCase.execute({ id: protocoloId }, 1);

      expect(result).toBeDefined();
      expect(result!.product).toBe("pix");
      expect(result!.type).toBe("LIQUIDATED");
    });

    it("deve buscar protocolo com dados JSONB complexos", async () => {
      const protocoloId = "550e8400-e29b-41d4-a716-446655440021";

      await WebhookReprocessado.create({
        id: protocoloId,
        data: {
          product: "boleto",
          ids: [1, 2, 3],
          metadata: {
            user: "test",
            timestamp: new Date().toISOString(),
          },
          nested: {
            level1: {
              level2: "deep value",
            },
          },
        },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1", "2", "3"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      const result = await useCase.execute({ id: protocoloId }, 1);

      expect(result).toBeDefined();
      const data = result!.data as any;
      expect(data.metadata).toBeDefined();
      expect(data.nested.level1.level2).toBe("deep value");
    });
  });

  describe("Performance e concorrência", () => {
    it("deve buscar múltiplos protocolos simultaneamente", async () => {
      const ids = [
        "550e8400-e29b-41d4-a716-446655440030",
        "550e8400-e29b-41d4-a716-446655440031",
        "550e8400-e29b-41d4-a716-446655440032",
      ];

      await WebhookReprocessado.bulkCreate(
        ids.map((id, index) => ({
          id,
          data: { concurrent: index },
          cedente_id: 1,
          kind: "webhook",
          type: "DISPONIVEL",
          servico_id: [String(index + 1)],
          product: "boleto",
          data_criacao: new Date(),
        })) as any[],
      );

      const promises = ids.map((id) => useCase.execute({ id }, 1));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r !== null)).toBe(true);
      expect(results.map((r) => r!.id)).toEqual(ids);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com UUID em diferentes formatos", async () => {
      const protocoloId = "550E8400-E29B-41D4-A716-446655440040"; // Uppercase

      await WebhookReprocessado.create({
        id: protocoloId.toLowerCase(),
        data: { test: "uuid format" },
        cedente_id: 1,
        kind: "webhook",
        type: "DISPONIVEL",
        servico_id: ["1"],
        product: "boleto",
        data_criacao: new Date(),
      } as any);

      // Buscar com lowercase
      const result = await useCase.execute(
        { id: protocoloId.toLowerCase() },
        1,
      );

      expect(result).toBeDefined();
    });

    it("deve retornar null para ID inválido/malformado", async () => {
      const result = await useCase.execute({ id: "invalid-id" }, 1);

      expect(result).toBeNull();
    });
  });
});
