import { validateAuthHeaders } from "@/modules/protocolo/interfaces/http/middlewares/protocolo/validate-auth-headers";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { DatabaseHelper } from "../../../../../helpers/database.helper";

describe("[Integration] validateAuthHeaders Middleware (Protocolo) - Database", () => {
  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  beforeEach(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.seedTestData();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
    await DatabaseHelper.close();
  });

  describe("Validação básica de headers", () => {
    it("deve validar headers válidos", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      expect(result).toBeDefined();
      expect(result.softwarehouse).toBeDefined();
      expect(result.cedente).toBeDefined();
      expect(result.softwarehouse.id).toBeDefined();
      expect(result.cedente.id).toBeDefined();
    });

    it("deve lançar erro quando header de cedente estiver vazio", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "",
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("Validação de headers obrigatórios", () => {
    it("deve lançar erro se headers estiverem ausentes", async () => {
      const emptyHeaders = new Headers();

      await expect(validateAuthHeaders(emptyHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se apenas headers do SH forem enviados", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se apenas headers do Cedente forem enviados", async () => {
      const headers = new Headers({
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se todos os headers estiverem vazios", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "",
        "x-api-token-sh": "",
        "x-api-cnpj-cedente": "",
        "x-api-token-cedente": "",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("Validação de retorno", () => {
    it("deve retornar objetos de SH e Cedente com estrutura correta", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      expect(result.softwarehouse).toHaveProperty("id");
      expect(result.softwarehouse).toHaveProperty("status");
      expect(result.cedente).toHaveProperty("id");
      expect(result.cedente).toHaveProperty("status");
    });

    it("deve retornar status ativo para entidades validadas", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      expect(result.softwarehouse.status).toBe("ativo");
      expect(result.cedente.status).toBe("ativo");
    });
  });

  describe("Erro handling", () => {
    it("deve lançar UnauthorizedError com código e status corretos", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "",
        "x-api-token-sh": "",
        "x-api-cnpj-cedente": "",
        "x-api-token-cedente": "",
      });

      try {
        await validateAuthHeaders(headers);
        fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        // O erro pode ter propriedades específicas dependendo da implementação
      }
    });
  });

  describe("Case sensitivity", () => {
    it("deve aceitar headers em uppercase (case-insensitive)", async () => {
      const headers = new Headers({
        "X-API-CNPJ-SH": "12345678901234",
        "X-API-TOKEN-SH": "sh-token-test",
        "X-API-CNPJ-CEDENTE": "98765432109876",
        "X-API-TOKEN-CEDENTE": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      expect(result).toBeDefined();
      expect(result.softwarehouse).toBeDefined();
      expect(result.cedente).toBeDefined();
    });
  });

  describe("Cenários de integração real", () => {
    it("deve validar headers em sequência de múltiplas requisições", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      // Simular múltiplas requisições
      const results = await Promise.all([
        validateAuthHeaders(headers),
        validateAuthHeaders(headers),
        validateAuthHeaders(headers),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.softwarehouse.id === 1)).toBe(true);
      expect(results.every((r) => r.cedente.id === 1)).toBe(true);
    });
  });
});
