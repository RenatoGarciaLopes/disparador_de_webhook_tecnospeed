import { ServicoRepository } from "@/modules/webhook/infrastructure/database/repositories/ServicoRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] ServicoRepository - Database", () => {
  let repository: ServicoRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new ServicoRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("findAllByIds - Query real no PostgreSQL", () => {
    it("deve buscar serviços existentes do banco real", async () => {
      // SEM mock do Servico.findAll - query SQL real
      const servicos = await repository.findAllByIds([1, 2]);

      expect(servicos).toHaveLength(2);
      expect(servicos[0].dataValues.id).toBe(1);
      expect(servicos[1].dataValues.id).toBe(2);
    });

    it("deve retornar array vazio quando IDs não existem (query real)", async () => {
      const servicos = await repository.findAllByIds([999, 888]);

      expect(servicos).toEqual([]);
      expect(servicos).toHaveLength(0);
    });

    it("deve carregar relacionamentos com JOINs reais", async () => {
      const servicos = await repository.findAllByIds([1]);

      // Valida que JOINs foram executados
      expect(servicos[0]).toHaveProperty("convenio");
      expect(servicos[0].convenio).toHaveProperty("conta");
      expect(servicos[0].convenio.conta).toHaveProperty("cedente");
      expect(servicos[0].convenio.conta).toHaveProperty("dataValues");
    });

    it("deve retornar configuracao_notificacao via relacionamento", async () => {
      const servicos = await repository.findAllByIds([1]);

      const configuracao =
        servicos[0].convenio.conta.dataValues.configuracao_notificacao;

      expect(configuracao).toBeDefined();
      expect(configuracao).toHaveProperty("url");
    });

    it("deve lidar com múltiplos IDs (performance)", async () => {
      const ids = [1, 2]; // Apenas IDs que existem no seed
      const servicos = await repository.findAllByIds(ids);

      expect(servicos.length).toBeLessThanOrEqual(ids.length);
    });
  });

  describe("Filtros e condições WHERE", () => {
    it("deve retornar apenas serviços que existem no banco", async () => {
      const servicos = await repository.findAllByIds([1, 999]);

      // Apenas ID 1 existe no seed
      expect(servicos.length).toBeGreaterThan(0);
      expect(servicos.every((s) => [1].includes(s.dataValues.id))).toBe(true);
    });
  });

  describe("Eager loading de relacionamentos", () => {
    it("deve carregar estrutura completa: convenio → conta → cedente", async () => {
      const servicos = await repository.findAllByIds([1]);

      const servico = servicos[0];

      // Valida estrutura aninhada carregada
      expect(servico.convenio).toBeDefined();
      expect(servico.convenio.conta).toBeDefined();
      expect(servico.convenio.conta.cedente).toBeDefined();
      expect(servico.convenio.conta.cedente.dataValues).toBeDefined();
    });

    it("deve incluir dataValues em cada nível do relacionamento", async () => {
      const servicos = await repository.findAllByIds([1]);

      expect(servicos[0].dataValues).toBeDefined();
      expect(servicos[0].convenio.conta.dataValues).toBeDefined();
      expect(servicos[0].convenio.conta.cedente.dataValues).toBeDefined();
    });
  });
});
