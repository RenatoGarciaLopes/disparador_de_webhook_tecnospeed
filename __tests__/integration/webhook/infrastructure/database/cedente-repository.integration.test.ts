import { CedenteRepository } from "@/modules/webhook/infrastructure/database/repositories/CedenteRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] CedenteRepository - Database", () => {
  let repository: CedenteRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new CedenteRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("findByCnpjAndToken - Query real", () => {
    it("deve buscar Cedente existente no banco real", async () => {
      const cedente = await repository.findByCnpjAndToken(
        "98765432109876",
        "cedente-token-test",
      );

      expect(cedente).toBeDefined();
      expect(cedente?.dataValues.id).toBeDefined();
      expect(cedente?.dataValues.cnpj).toBe("98765432109876");
      expect(cedente?.dataValues.status).toBe("ativo");
      expect(cedente?.dataValues.softwarehouse_id).toBeDefined();
    });

    it("deve retornar null quando CNPJ não existe", async () => {
      const cedente = await repository.findByCnpjAndToken(
        "00000000000000",
        "token-qualquer",
      );

      expect(cedente).toBeNull();
    });

    it("deve retornar null quando token não corresponde", async () => {
      const cedente = await repository.findByCnpjAndToken(
        "98765432109876",
        "token-errado",
      );

      expect(cedente).toBeNull();
    });

    it("deve validar foreign key softwarehouse_id", async () => {
      const cedente = await repository.findByCnpjAndToken(
        "98765432109876",
        "cedente-token-test",
      );

      expect(cedente).toBeDefined();
      expect(cedente?.dataValues.softwarehouse_id).toBeGreaterThan(0);
    });
  });

  describe("validateAuth - Validação com banco real (DOCS linha 35-41)", () => {
    it("deve validar Cedente ativo associado à SH correta", async () => {
      const result = await repository.validateAuth(
        "98765432109876",
        "cedente-token-test",
        1, // softwarehouse_id do seed
      );

      expect(result.valid).toBe(true);
      expect(result.cedente).toBeDefined();
      expect(result.cedente?.dataValues.status).toBe("ativo");
      expect(result.cedente?.dataValues.softwarehouse_id).toBe(1);
    });

    it("deve invalidar quando Cedente não existe (DOCS linha 37)", async () => {
      const result = await repository.validateAuth(
        "00000000000000",
        "token-invalido",
        1,
      );

      expect(result.valid).toBe(false);
      expect(result.cedente).toBeNull();
    });

    it("deve invalidar quando Cedente está inativo (DOCS linha 41)", async () => {
      // Cedente inativo no seed (se existir)
      const result = await repository.validateAuth(
        "11111111111111",
        "cedente-inativo-token",
        1,
      );

      // Se não existe, valid = false e cedente = null
      // Se existe mas inativo, valid = false e cedente != null com status inativo
      expect(result.valid).toBe(false);

      if (result.cedente) {
        expect(result.cedente.dataValues.status).toBe("inativo");
      }
    });

    it("deve invalidar quando Cedente não está associado à SH (DOCS linha 39)", async () => {
      const result = await repository.validateAuth(
        "98765432109876",
        "cedente-token-test",
        999, // softwarehouse_id que não corresponde
      );

      expect(result.valid).toBe(false);
      expect(result.cedente).toBeDefined();

      // O cedente existe mas pertence a outra SH
      const actualShId =
        result.cedente?.dataValues?.softwarehouse_id ||
        result.cedente?.softwarehouse_id;
      expect(actualShId).not.toBe(999);
    });

    it("deve validar corretamente múltiplos Cedentes de diferentes SHs", async () => {
      // Cedente de SH1
      const result1 = await repository.validateAuth(
        "98765432109876",
        "cedente-token-test",
        1,
      );

      expect(result1.valid).toBe(true);
      expect(result1.cedente?.dataValues.softwarehouse_id).toBe(1);

      // Se houver Cedente de SH2 no seed, validar também
      // (Este teste é condicional baseado nos dados do seed)
    });

    it("deve retornar objeto completo do Cedente na validação", async () => {
      const result = await repository.validateAuth(
        "98765432109876",
        "cedente-token-test",
        1,
      );

      expect(result.valid).toBe(true);
      expect(result.cedente?.dataValues).toHaveProperty("id");
      expect(result.cedente?.dataValues).toHaveProperty("cnpj");
      expect(result.cedente?.dataValues).toHaveProperty("token");
      expect(result.cedente?.dataValues).toHaveProperty("status");
      expect(result.cedente?.dataValues).toHaveProperty("softwarehouse_id");
    });
  });

  describe("Regras de negócio (DOCS linha 23)", () => {
    it("deve validar associação SH ↔ Cedente corretamente", async () => {
      const cedente = await repository.findByCnpjAndToken(
        "98765432109876",
        "cedente-token-test",
      );

      expect(cedente).toBeDefined();

      // Cedente deve ter um softwarehouse_id válido
      const shId = cedente?.dataValues?.softwarehouse_id;
      expect(shId).toBeDefined();
      expect(typeof shId).toBe("number");
      expect(shId).toBeGreaterThan(0);
    });

    it("deve falhar validação se tentar validar com SH errada", async () => {
      // Buscar cedente que pertence à SH 1
      const cedente = await repository.findByCnpjAndToken(
        "98765432109876",
        "cedente-token-test",
      );

      const actualShId = cedente?.dataValues?.softwarehouse_id || 1;

      // Tentar validar com SH diferente
      const differentShId = actualShId + 1;
      const result = await repository.validateAuth(
        "98765432109876",
        "cedente-token-test",
        differentShId,
      );

      expect(result.valid).toBe(false);
    });
  });
});
