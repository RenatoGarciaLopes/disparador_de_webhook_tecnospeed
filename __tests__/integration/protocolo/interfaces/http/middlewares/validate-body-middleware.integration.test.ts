import { validateBody } from "@/modules/protocolo/interfaces/http/middlewares/protocolo/validate-body";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";

describe("[Integration] validateBody Middleware (Protocolo)", () => {
  describe("Validação de body válido", () => {
    it("deve validar body com todos os campos opcionais", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
      expect(result.start_date).toEqual(body.start_date);
      expect(result.end_date).toEqual(body.end_date);
      expect(result.product).toBe("boleto");
      expect(result.id).toEqual(["1", "2"]);
      expect(result.kind).toBe("webhook");
      expect(result.type).toBe("DISPONIVEL");
    });

    it("deve validar body com campos mínimos (start_date e end_date)", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
      expect(result.start_date).toEqual(body.start_date);
      expect(result.end_date).toEqual(body.end_date);
    });

    it("deve validar body com apenas alguns campos opcionais", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        product: "pix",
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
      expect(result.product).toBe("pix");
    });
  });

  describe("Validação de campos extras (strict mode)", () => {
    it("deve lançar erro para campos extras não permitidos", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        extraField: "not allowed",
      };

      await expect(validateBody(body)).rejects.toThrow(InvalidFieldsError);
    });

    it("deve permitir apenas campos do schema", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(6);
    });
  });

  describe("Validação de tipos de dados", () => {
    it("deve aceitar diferentes formatos de data", async () => {
      const body = {
        start_date: "2025-01-01",
        end_date: "2025-01-31",
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
    });

    it("deve aceitar diferentes tipos de produto", async () => {
      const products = ["boleto", "pix", "pagamento"];

      for (const product of products) {
        const body = {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          product,
        };

        const result = await validateBody(body);
        expect(result.product).toBe(product);
      }
    });

    it("deve aceitar array de IDs", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        id: ["1", "2", "3", "4", "5"],
      };

      const result = await validateBody(body);

      expect(result.id).toEqual(["1", "2", "3", "4", "5"]);
      expect(Array.isArray(result.id)).toBe(true);
    });
  });

  describe("Validação de valores especiais", () => {
    it("deve aceitar valores null/undefined em campos opcionais", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        product: undefined,
        id: undefined,
        kind: undefined,
        type: undefined,
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
    });

    it("deve aceitar array vazio de IDs", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        id: [],
      };

      const result = await validateBody(body);

      expect(result.id).toEqual([]);
    });
  });

  describe("Erro handling", () => {
    it("deve lançar InvalidFieldsError para body inválido", async () => {
      const body = {
        extraField: "not allowed",
      };

      try {
        await validateBody(body);
        fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
      }
    });

    it("deve incluir detalhes do erro de validação", async () => {
      const body = {
        unknownField: "value",
      };

      try {
        await validateBody(body);
        fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
        const invalidError = error as InvalidFieldsError;
        expect(invalidError.error).toBeDefined();
      }
    });
  });

  describe("Cenários de uso real", () => {
    it("deve validar body típico de busca de protocolos", async () => {
      const body = {
        start_date: new Date("2025-01-01T00:00:00Z"),
        end_date: new Date("2025-01-31T23:59:59Z"),
        product: "boleto",
        kind: "webhook",
        type: "DISPONIVEL",
      };

      const result = await validateBody(body);

      expect(result).toBeDefined();
      expect(result.start_date).toBeDefined();
      expect(result.end_date).toBeDefined();
      expect(result.product).toBe("boleto");
    });

    it("deve validar body de busca por IDs específicos", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
        id: ["550e8400-e29b-41d4-a716-446655440001"],
      };

      const result = await validateBody(body);

      expect(result.id).toHaveLength(1);
    });

    it("deve validar body com filtros múltiplos combinados", async () => {
      const body = {
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-12-31"),
        product: "pix",
        kind: "webhook",
        type: "LIQUIDATED",
        id: ["1", "2", "3"],
      };

      const result = await validateBody(body);

      expect(result.product).toBe("pix");
      expect(result.kind).toBe("webhook");
      expect(result.type).toBe("LIQUIDATED");
      expect(result.id).toHaveLength(3);
    });
  });

  describe("Validação de diferentes tipos", () => {
    it("deve aceitar diferentes valores de type", async () => {
      const types = ["DISPONIVEL", "LIQUIDATED", "SCHEDULED", "ACTIVE"];

      for (const type of types) {
        const body = {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          type,
        };

        const result = await validateBody(body);
        expect(result.type).toBe(type);
      }
    });

    it("deve aceitar diferentes valores de kind", async () => {
      const kinds = ["webhook", "api", "manual"];

      for (const kind of kinds) {
        const body = {
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-01-31"),
          kind,
        };

        const result = await validateBody(body);
        expect(result.kind).toBe(kind);
      }
    });
  });
});
