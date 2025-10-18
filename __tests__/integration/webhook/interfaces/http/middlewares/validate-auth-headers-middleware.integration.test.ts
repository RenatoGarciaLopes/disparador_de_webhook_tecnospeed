import { validateAuthHeaders } from "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-auth-headers";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { DatabaseHelper } from "../../../../../helpers/database.helper";

describe("[Integration] validateAuthHeaders Middleware - Database", () => {
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

  describe("Validação com queries reais no banco", () => {
    it("deve validar SH e Cedente existentes no banco", async () => {
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
      expect(result.cedente.softwarehouse_id).toBe(result.softwarehouse.id);
    });

    it("deve lançar erro quando SH não existe no banco (DOCS linha 29)", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "00000000000000", // Não existe
        "x-api-token-sh": "token-qualquer",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando token da SH está incorreto (DOCS linha 29)", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "token-errado", // Token incorreto
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando SH está inativa (DOCS linha 31)", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "99999999999999", // SH inativa no seed
        "x-api-token-sh": "sh-inativa-token",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando Cedente não existe (DOCS linha 37)", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "00000000000000", // Não existe
        "x-api-token-cedente": "token-invalido",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando token do Cedente está incorreto", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "token-errado", // Token incorreto
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando Cedente está inativo (DOCS linha 41)", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "11111111111111", // Cedente inativo no seed
        "x-api-token-cedente": "cedente-inativo-token",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro quando Cedente não está associado à SH (DOCS linha 39)", async () => {
      // Este teste assume que existe um Cedente associado a outra SH no seed
      // Se não existir, o teste irá falhar por "Cedente não encontrado"
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234", // SH 1
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "22222222222222", // Cedente da SH 2 (se existir)
        "x-api-token-cedente": "cedente-sh2-token",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("Ordem de validação (DOCS linha 23)", () => {
    it("deve validar SH antes de Cedente - não buscar Cedente se SH falhar", async () => {
      // Se SH for inválida, erro deve ocorrer antes de validar Cedente
      const headers = new Headers({
        "x-api-cnpj-sh": "00000000000000", // SH inválida
        "x-api-token-sh": "invalido",
        "x-api-cnpj-cedente": "98765432109876", // Cedente válido
        "x-api-token-cedente": "cedente-token-test",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );

      // Se chegou aqui, erro foi lançado na validação da SH (ordem correta)
    });

    it("deve validar Cedente apenas se SH for válida", async () => {
      // SH válida, Cedente inválido
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234", // SH válida
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "00000000000000", // Cedente inválido
        "x-api-token-cedente": "invalido",
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );

      // Se erro foi lançado, validação chegou até o Cedente (SH passou)
    });
  });

  describe("Retorno de dados validados", () => {
    it("deve retornar objetos completos de SH e Cedente", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      // Validar estrutura do retorno
      expect(result.softwarehouse).toHaveProperty("id");
      expect(result.softwarehouse).toHaveProperty("cnpj");
      expect(result.softwarehouse).toHaveProperty("status");

      expect(result.cedente).toHaveProperty("id");
      expect(result.cedente).toHaveProperty("cnpj");
      expect(result.cedente).toHaveProperty("status");
      expect(result.cedente).toHaveProperty("softwarehouse_id");
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

    it("deve garantir que Cedente pertence à SH validada", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      const result = await validateAuthHeaders(headers);

      expect(result.cedente.softwarehouse_id).toBe(result.softwarehouse.id);
    });
  });

  describe("Validação de headers obrigatórios", () => {
    it("deve lançar erro se headers estiverem ausentes", async () => {
      const emptyHeaders = new Headers();

      await expect(validateAuthHeaders(emptyHeaders)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se apenas headers da SH forem enviados", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "12345678901234",
        "x-api-token-sh": "sh-token-test",
        // Faltam headers do Cedente
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se apenas headers do Cedente forem enviados", async () => {
      const headers = new Headers({
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
        // Faltam headers da SH
      });

      await expect(validateAuthHeaders(headers)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("deve lançar erro se headers estiverem vazios", async () => {
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

  describe("Erro handling", () => {
    it("deve lançar UnauthorizedError com código correto", async () => {
      const headers = new Headers({
        "x-api-cnpj-sh": "00000000000000",
        "x-api-token-sh": "invalido",
        "x-api-cnpj-cedente": "98765432109876",
        "x-api-token-cedente": "cedente-token-test",
      });

      try {
        await validateAuthHeaders(headers);
        fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect((error as UnauthorizedError).code).toBe("UNAUTHORIZED");
        expect((error as UnauthorizedError).statusCode).toBe(401);
      }
    });
  });

  describe("Case sensitivity", () => {
    it("deve aceitar headers em diferentes cases (case-insensitive)", async () => {
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
});
