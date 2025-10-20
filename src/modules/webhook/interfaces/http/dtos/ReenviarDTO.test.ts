import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ReenviarDTO } from "./ReenviarDTO";

describe("[WEBHOOK] ReenviarDTO", () => {
  describe("Construtor - Casos de sucesso", () => {
    it("deve criar uma instância com body válido", () => {
      const body = {
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(dto).toBeInstanceOf(ReenviarDTO);
      expect(dto.product).toBe("BOLETO");
      expect(dto.id).toEqual([1, 2, 3]);
      expect(dto.kind).toBe("webhook");
      expect(dto.type).toBe("pago");
    });

    it("deve transformar product para uppercase", () => {
      const body = {
        product: "pagamento",
        id: ["1"],
        kind: "webhook",
        type: "cancelado",
      };

      const dto = new ReenviarDTO(body);

      expect(dto.product).toBe("PAGAMENTO");
    });

    it("deve transformar id de string para number", () => {
      const body = {
        product: "pix",
        id: ["10", "20", "30"],
        kind: "webhook",
        type: "disponivel",
      };

      const dto = new ReenviarDTO(body);

      expect(dto.id).toEqual([10, 20, 30]);
      expect(typeof dto.id[0]).toBe("number");
    });

    it("deve aceitar diferentes valores de product", () => {
      const boleto = new ReenviarDTO({
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      });
      expect(boleto.product).toBe("BOLETO");

      const pagamento = new ReenviarDTO({
        product: "pagamento",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      });
      expect(pagamento.product).toBe("PAGAMENTO");

      const pix = new ReenviarDTO({
        product: "pix",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      });
      expect(pix.product).toBe("PIX");
    });

    it("deve aceitar diferentes valores de type", () => {
      const pago = new ReenviarDTO({
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      });
      expect(pago.type).toBe("pago");

      const cancelado = new ReenviarDTO({
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "cancelado",
      });
      expect(cancelado.type).toBe("cancelado");

      const disponivel = new ReenviarDTO({
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      });
      expect(disponivel.type).toBe("disponivel");
    });

    it("deve aceitar array com múltiplos ids", () => {
      const body = {
        product: "boleto",
        id: ["1", "2", "3", "4", "5"],
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(dto.id).toHaveLength(5);
      expect(dto.id).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Construtor - Validação de campos obrigatórios", () => {
    it("deve lançar InvalidFieldsError quando product está ausente", () => {
      const body = {
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando id está ausente", () => {
      const body = {
        product: "boleto",
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando kind está ausente", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando type está ausente", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando todos os campos estão ausentes", () => {
      const body = {};

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });
  });

  describe("Construtor - Validação de valores enum", () => {
    it("deve lançar InvalidFieldsError quando product é inválido", () => {
      const body = {
        product: "invalido",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando kind é inválido", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "invalido",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando type é inválido", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "invalido",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });
  });

  describe("Construtor - Validação do array de ids", () => {
    it("deve lançar InvalidFieldsError quando id é um array vazio", () => {
      const body = {
        product: "boleto",
        id: [],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando id tem mais de 30 elementos", () => {
      const body = {
        product: "boleto",
        id: Array.from({ length: 31 }, (_, i) => String(i + 1)),
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve aceitar id com exatamente 30 elementos", () => {
      const body = {
        product: "boleto",
        id: Array.from({ length: 30 }, (_, i) => String(i + 1)),
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(dto.id).toHaveLength(30);
    });

    it("deve lançar InvalidFieldsError quando id contém valor não numérico", () => {
      const body = {
        product: "boleto",
        id: ["1", "abc", "3"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando id contém número negativo", () => {
      const body = {
        product: "boleto",
        id: ["1", "-5", "3"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando id contém zero", () => {
      const body = {
        product: "boleto",
        id: ["1", "0", "3"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });

    it("deve lançar InvalidFieldsError quando id contém número decimal", () => {
      const body = {
        product: "boleto",
        id: ["1", "2.5", "3"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });
  });

  describe("Implementação da interface IReenviarDTO", () => {
    it("deve implementar a interface IReenviarDTO", () => {
      const body = {
        product: "boleto",
        id: ["1", "2"],
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(dto).toHaveProperty("product");
      expect(dto).toHaveProperty("id");
      expect(dto).toHaveProperty("kind");
      expect(dto).toHaveProperty("type");
    });

    it("product deve ter tipo correto", () => {
      const body = {
        product: "pix",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };

      const dto = new ReenviarDTO(body);

      expect(["BOLETO", "PAGAMENTO", "PIX"]).toContain(dto.product);
    });

    it("id deve ser um array de números", () => {
      const body = {
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(Array.isArray(dto.id)).toBe(true);
      dto.id.forEach((item) => {
        expect(typeof item).toBe("number");
      });
    });

    it("kind deve ter tipo correto", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      const dto = new ReenviarDTO(body);

      expect(dto.kind).toBe("webhook");
    });

    it("type deve ter tipo correto", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "cancelado",
      };

      const dto = new ReenviarDTO(body);

      expect(["pago", "cancelado", "disponivel"]).toContain(dto.type);
    });
  });

  describe("Validação com Zod (ReenviarDTOValidator)", () => {
    it("deve usar ReenviarDTOValidator.safeParse internamente", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
      };

      expect(() => new ReenviarDTO(body)).not.toThrow();
    });

    it("deve lançar InvalidFieldsError criado a partir do ZodError", () => {
      const body = {
        product: "invalido",
      };

      try {
        new ReenviarDTO(body);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
        expect((error as InvalidFieldsError).code).toBe("INVALID_FIELDS");
      }
    });

    it("InvalidFieldsError deve conter informações do erro de validação", () => {
      const body = {
        product: "boleto",
        id: [],
      };

      try {
        new ReenviarDTO(body);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldsError);
        const invalidFieldsError = error as InvalidFieldsError;
        expect(invalidFieldsError.error).toBeDefined();
      }
    });
  });

  describe("Validação strict", () => {
    it("deve lançar InvalidFieldsError quando há campos extras", () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "pago",
        campoExtra: "não permitido",
      };

      expect(() => new ReenviarDTO(body)).toThrow(InvalidFieldsError);
    });
  });
});
