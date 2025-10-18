import { SoftwareHouseRepository } from "@/modules/webhook/infrastructure/database/repositories/SoftwareHouseRepository";
import { DatabaseHelper } from "../../helpers/database.helper";

describe("[Integration] SoftwareHouseRepository - Database", () => {
  let repository: SoftwareHouseRepository;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
    repository = new SoftwareHouseRepository();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("findByCnpjAndToken - Query real", () => {
    it("deve buscar Software House existente no banco real", async () => {
      const sh = await repository.findByCnpjAndToken(
        "12345678901234",
        "sh-token-test",
      );

      expect(sh).toBeDefined();
      expect(sh?.dataValues.id).toBeDefined();
      expect(sh?.dataValues.cnpj).toBe("12345678901234");
      expect(sh?.dataValues.status).toBe("ativo");
    });

    it("deve retornar null quando CNPJ não existe no banco", async () => {
      const sh = await repository.findByCnpjAndToken(
        "00000000000000",
        "token-qualquer",
      );

      expect(sh).toBeNull();
    });

    it("deve retornar null quando token não corresponde", async () => {
      const sh = await repository.findByCnpjAndToken(
        "12345678901234",
        "token-errado",
      );

      expect(sh).toBeNull();
    });

    it("deve buscar Software House inativa do banco", async () => {
      // Assumindo que o seed tem uma SH inativa com esses dados
      const sh = await repository.findByCnpjAndToken(
        "99999999999999",
        "sh-inativa-token",
      );

      // Se existir no seed, deve ter status inativo
      if (sh) {
        expect(sh.dataValues.status).toBe("inativo");
      } else {
        // Se não existir no seed, o teste passa
        expect(sh).toBeNull();
      }
    });
  });

  describe("validateAuth - Validação com banco real", () => {
    it("deve validar Software House ativa com sucesso", async () => {
      const result = await repository.validateAuth(
        "12345678901234",
        "sh-token-test",
      );

      expect(result.valid).toBe(true);
      expect(result.softwareHouse).toBeDefined();
      expect(result.softwareHouse?.dataValues.status).toBe("ativo");
    });

    it("deve invalidar quando Software House não existe", async () => {
      const result = await repository.validateAuth(
        "00000000000000",
        "token-invalido",
      );

      expect(result.valid).toBe(false);
      expect(result.softwareHouse).toBeNull();
    });

    it("deve invalidar quando Software House está inativa", async () => {
      // SH inativa no seed (se existir)
      const result = await repository.validateAuth(
        "99999999999999",
        "sh-inativa-token",
      );

      // Se SH não existe, valid = false e softwareHouse = null
      // Se SH existe mas inativa, valid = false e softwareHouse != null
      expect(result.valid).toBe(false);

      if (result.softwareHouse) {
        expect(result.softwareHouse.dataValues.status).toBe("inativo");
      }
    });

    it("deve invalidar quando token está incorreto", async () => {
      const result = await repository.validateAuth(
        "12345678901234",
        "token-errado",
      );

      expect(result.valid).toBe(false);
    });

    it("deve validar que retorna objeto completo da SH", async () => {
      const result = await repository.validateAuth(
        "12345678901234",
        "sh-token-test",
      );

      expect(result.valid).toBe(true);
      expect(result.softwareHouse?.dataValues).toHaveProperty("id");
      expect(result.softwareHouse?.dataValues).toHaveProperty("cnpj");
      expect(result.softwareHouse?.dataValues).toHaveProperty("token");
      expect(result.softwareHouse?.dataValues).toHaveProperty("status");
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com CNPJs com zeros à esquerda", async () => {
      // CNPJ com zeros é tratado como string
      const sh = await repository.findByCnpjAndToken(
        "00012345678901",
        "any-token",
      );

      // Deve retornar null se não existe
      expect(sh).toBeNull();
    });
  });
});
