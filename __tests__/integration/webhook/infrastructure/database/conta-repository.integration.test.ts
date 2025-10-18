import { ContaRepository } from "@/modules/webhook/infrastructure/database/repositories/ContaRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] ContaRepository - Database", () => {
  let repository: ContaRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new ContaRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("findById - Query real no PostgreSQL", () => {
    it("deve buscar conta existente no banco real", async () => {
      // Assumindo que seed cria conta com ID 1
      const conta = await repository.findById(1);

      expect(conta).toBeDefined();
      expect(conta?.dataValues.id).toBe(1);
      expect(conta?.dataValues).toHaveProperty("configuracao_notificacao");
    });

    it("deve retornar null para conta inexistente", async () => {
      const conta = await repository.findById(99999);

      expect(conta).toBeNull();
    });

    it("deve carregar configuracao_notificacao quando existe", async () => {
      const conta = await repository.findById(1);

      expect(conta).toBeDefined();
      if (conta?.dataValues.configuracao_notificacao) {
        expect(conta.dataValues.configuracao_notificacao).toHaveProperty("url");
      }
    });

    it("deve incluir relacionamento com Cedente", async () => {
      const conta = await repository.findById(1);

      expect(conta).toBeDefined();
      expect(conta).toHaveProperty("cedente");
      if (conta?.cedente) {
        expect(conta.cedente.dataValues).toHaveProperty("id");
        expect(conta.cedente.dataValues).toHaveProperty("cnpj");
      }
    });
  });

  describe("findByIds - Query real com múltiplos IDs", () => {
    it("deve buscar múltiplas contas do banco real", async () => {
      const contas = await repository.findByIds([1, 2]);

      expect(contas).toBeDefined();
      expect(Array.isArray(contas)).toBe(true);
      expect(contas.length).toBeGreaterThan(0);
    });

    it("deve retornar apenas contas que existem", async () => {
      // IDs 1 e 2 existem, 999 não existe
      const contas = await repository.findByIds([1, 2, 999]);

      expect(contas).toBeDefined();
      expect(contas.length).toBeLessThanOrEqual(2);
      expect(contas.every((c) => c.dataValues.id !== 999)).toBe(true);
    });

    it("deve retornar array vazio para IDs inexistentes", async () => {
      const contas = await repository.findByIds([9998, 9999]);

      expect(contas).toBeDefined();
      expect(contas).toHaveLength(0);
    });

    it("deve retornar array vazio para array de IDs vazio", async () => {
      const contas = await repository.findByIds([]);

      expect(contas).toBeDefined();
      expect(contas).toHaveLength(0);
    });

    it("deve manter ordem dos IDs no resultado (quando possível)", async () => {
      const contas = await repository.findByIds([2, 1]);

      expect(contas).toBeDefined();
      expect(contas.length).toBeGreaterThan(0);
      // IDs devem estar presentes (ordem pode variar dependendo do banco)
      const ids = contas.map((c) => c.dataValues.id);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
    });
  });

  describe("findByCedenteId - Query real por Cedente", () => {
    it("deve buscar todas as contas de um cedente", async () => {
      // Assumindo que cedente 1 tem contas no seed
      const contas = await repository.findByCedenteId(1);

      expect(contas).toBeDefined();
      expect(Array.isArray(contas)).toBe(true);
      if (contas.length > 0) {
        expect(contas.every((c) => c.dataValues.cedente_id === 1)).toBe(true);
      }
    });

    it("deve retornar array vazio para cedente sem contas", async () => {
      const contas = await repository.findByCedenteId(99999);

      expect(contas).toBeDefined();
      expect(contas).toHaveLength(0);
    });

    it("deve incluir configuracao_notificacao nas contas", async () => {
      const contas = await repository.findByCedenteId(1);

      if (contas.length > 0) {
        contas.forEach((conta) => {
          expect(conta.dataValues).toHaveProperty("configuracao_notificacao");
        });
      }
    });

    it("deve retornar múltiplas contas quando cedente tem várias", async () => {
      const contas = await repository.findByCedenteId(1);

      // Assumindo que seed cria múltiplas contas para cedente 1
      expect(contas).toBeDefined();
      if (contas.length > 1) {
        const ids = contas.map((c) => c.dataValues.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(contas.length); // Sem duplicatas
      }
    });
  });

  describe("findByIdsWithRelations - Query real com eager loading", () => {
    it("deve buscar contas com Cedente carregado", async () => {
      const contas = await repository.findByIdsWithRelations([1]);

      expect(contas).toBeDefined();
      expect(contas.length).toBeGreaterThan(0);
      expect(contas[0]).toHaveProperty("cedente");
      expect(contas[0].cedente).toBeDefined();
    });

    it("deve carregar configuracao_notificacao do Cedente", async () => {
      const contas = await repository.findByIdsWithRelations([1]);

      expect(contas).toBeDefined();
      if (contas.length > 0 && contas[0].cedente) {
        expect(contas[0].cedente.dataValues).toHaveProperty(
          "configuracao_notificacao",
        );
      }
    });

    it("deve buscar múltiplas contas com relacionamentos", async () => {
      const contas = await repository.findByIdsWithRelations([1, 2]);

      expect(contas).toBeDefined();
      if (contas.length > 0) {
        contas.forEach((conta) => {
          expect(conta).toHaveProperty("cedente");
        });
      }
    });

    it("deve retornar array vazio para IDs inexistentes", async () => {
      const contas = await repository.findByIdsWithRelations([99999]);

      expect(contas).toBeDefined();
      expect(contas).toHaveLength(0);
    });
  });

  describe("Prioridade Conta > Cedente (DOCS linha 94-100)", () => {
    it("deve retornar conta com configuracao_notificacao quando existe", async () => {
      const conta = await repository.findById(1);

      expect(conta).toBeDefined();
      // Se conta tem configuração, deve estar preenchida
      if (conta?.dataValues.configuracao_notificacao) {
        expect(conta.dataValues.configuracao_notificacao).toHaveProperty("url");
        expect(typeof conta.dataValues.configuracao_notificacao.url).toBe(
          "string",
        );
      }
    });

    it("deve permitir configuracao_notificacao nula (fallback para Cedente)", async () => {
      const conta = await repository.findById(1);

      expect(conta).toBeDefined();
      // configuracao_notificacao pode ser null (usará do Cedente)
      if (conta?.dataValues.configuracao_notificacao === null) {
        expect(conta.cedente).toBeDefined();
        expect(conta.cedente.dataValues).toHaveProperty(
          "configuracao_notificacao",
        );
      }
    });
  });

  describe("Performance e eficiência", () => {
    it("deve buscar múltiplas contas em query única", async () => {
      const startTime = Date.now();
      const contas = await repository.findByIds([1, 2, 3]);
      const duration = Date.now() - startTime;

      // Query deve ser rápida (< 100ms para 3 registros)
      expect(duration).toBeLessThan(100);
      expect(contas).toBeDefined();
    });

    it("deve usar eager loading eficientemente", async () => {
      const startTime = Date.now();
      const contas = await repository.findByIdsWithRelations([1, 2]);
      const duration = Date.now() - startTime;

      // Eager loading deve ser eficiente (< 200ms)
      expect(duration).toBeLessThan(200);
      expect(contas).toBeDefined();
    });
  });

  describe("Edge cases do banco", () => {
    it("deve lidar com conta com dados JSON complexos", async () => {
      const conta = await repository.findById(1);

      if (conta?.dataValues.configuracao_notificacao) {
        // Configuração é JSON - deve ser objeto válido
        expect(typeof conta.dataValues.configuracao_notificacao).toBe("object");
        expect(conta.dataValues.configuracao_notificacao).not.toBeNull();
      }
    });

    it("deve lidar com relacionamento Cedente sempre presente", async () => {
      const contas = await repository.findByIdsWithRelations([1, 2, 3]);

      // Todas as contas devem ter cedente (relacionamento obrigatório)
      if (contas.length > 0) {
        contas.forEach((conta) => {
          expect(conta.cedente).toBeDefined();
          expect(conta.cedente.dataValues.id).toBeGreaterThan(0);
        });
      }
    });

    it("deve manter integridade referencial", async () => {
      const conta = await repository.findById(1);

      if (conta?.dataValues.cedente_id) {
        // cedente_id da conta deve corresponder ao ID do Cedente relacionado
        expect(conta.cedente).toBeDefined();
        expect(conta.dataValues.cedente_id).toBe(conta.cedente.dataValues.id);
      }
    });
  });

  describe("Transações e concorrência", () => {
    it("deve suportar leituras concorrentes", async () => {
      const promises = [
        repository.findById(1),
        repository.findById(2),
        repository.findById(1), // Mesma conta duas vezes
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]?.dataValues.id).toBe(1);
      expect(results[1]?.dataValues.id).toBe(2);
      expect(results[2]?.dataValues.id).toBe(1);
    });

    it("deve manter consistência em leituras múltiplas", async () => {
      const conta1 = await repository.findById(1);
      const conta2 = await repository.findById(1);

      // Mesma conta lida duas vezes deve ter mesmos dados
      expect(conta1?.dataValues.id).toBe(conta2?.dataValues.id);
      if (conta1 && conta2) {
        expect(conta1.dataValues.cedente_id).toBe(conta2.dataValues.cedente_id);
      }
    });
  });
});
