import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ReenviarSchema } from "../../validators/ReenviarSchema";
import { validateBody } from "./validate-body";

describe("[HTTP Middleware] /reenviar - validateBody", () => {
  const fake = new InvalidFieldsError({ errors: ["teste"] }, "INVALID_FIELDS");
  const spy = jest
    .spyOn(InvalidFieldsError, "fromZodError")
    .mockReturnValue(fake);

  afterEach(() => {
    spy.mockClear();
  });

  describe("Validação de campos obrigatórios", () => {
    it("deve lançar erro se campos obrigatórios não forem enviados", async () => {
      await expect(validateBody({})).rejects.toBe(fake);
      expect(spy).toHaveBeenCalled();
    });

    it("deve lançar erro se product estiver ausente ou inválido", async () => {
      const body = { id: ["1"], kind: "webhook", type: "disponivel" };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve lançar erro se id estiver ausente ou não for array", async () => {
      const body = { product: "boleto", kind: "webhook", type: "disponivel" };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve lançar erro se kind estiver ausente ou inválido", async () => {
      const body = { product: "boleto", id: ["1"], type: "disponivel" };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve lançar erro se type estiver ausente ou inválido", async () => {
      const body = { product: "boleto", id: ["1"], kind: "webhook" };
      await expect(validateBody(body)).rejects.toBe(fake);
    });
  });

  describe("Validação de product", () => {
    it("deve aceitar produtos válidos: boleto, pagamento, pix", async () => {
      const bodyBoleto = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };
      const result = await validateBody(bodyBoleto);
      expect(result.product).toBe("BOLETO");
    });

    it("deve rejeitar product inválido", async () => {
      const body = {
        product: "invalid",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });
  });

  describe("Validação de id", () => {
    it("deve converter array de strings para números", async () => {
      const body = {
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "disponivel",
      };
      const result = await validateBody(body);
      expect(result.id).toEqual([1, 2, 3]);
    });

    it("deve rejeitar array vazio", async () => {
      const body = {
        product: "boleto",
        id: [],
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve rejeitar array com mais de 30 itens", async () => {
      const body = {
        product: "boleto",
        id: Array.from({ length: 31 }, (_, i) => String(i + 1)),
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve rejeitar strings não numéricas no array", async () => {
      const body = {
        product: "boleto",
        id: ["1", "abc", "3"],
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });

    it("deve rejeitar números negativos ou zero", async () => {
      const bodyNegative = {
        product: "boleto",
        id: ["-1"],
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(bodyNegative)).rejects.toBe(fake);

      const bodyZero = {
        product: "boleto",
        id: ["0"],
        kind: "webhook",
        type: "disponivel",
      };
      await expect(validateBody(bodyZero)).rejects.toBe(fake);
    });
  });

  describe("Validação de kind", () => {
    it("deve aceitar apenas 'webhook' como kind", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };
      const result = await validateBody(body);
      expect(result.kind).toBe("webhook");
    });

    it("deve rejeitar kind diferente de 'webhook'", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "email",
        type: "disponivel",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });
  });

  describe("Validação de type", () => {
    it("deve aceitar types válidos: disponivel, cancelado, pago", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };
      const result = await validateBody(body);
      expect(result.type).toBe("DISPONIVEL");
    });

    it("deve rejeitar type inválido", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "invalid",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });
  });

  describe("Validação strict mode", () => {
    it("deve rejeitar campos extras", async () => {
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
        extraField: "não permitido",
      };
      await expect(validateBody(body)).rejects.toBe(fake);
    });
  });

  describe("Transformações", () => {
    it("deve transformar body completo corretamente", async () => {
      const body = {
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "disponivel",
      };

      const result = await validateBody(body);

      expect(result).toEqual({
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      });
    });

    it("deve funcionar com todos os products e types", async () => {
      const bodyPagamento = {
        product: "pagamento",
        id: ["10"],
        kind: "webhook",
        type: "cancelado",
      };
      const resultPagamento = await validateBody(bodyPagamento);
      expect(resultPagamento.product).toBe("PAGAMENTO");
      expect(resultPagamento.type).toBe("CANCELADO");

      const bodyPix = {
        product: "pix",
        id: ["5"],
        kind: "webhook",
        type: "pago",
      };
      const resultPix = await validateBody(bodyPix);
      expect(resultPix.product).toBe("PIX");
      expect(resultPix.type).toBe("PAGO");
    });
  });

  describe("Integração com Zod", () => {
    it("deve chamar ReenviarSchema.safeParse", async () => {
      const safeParseSpy = jest.spyOn(ReenviarSchema, "safeParse");
      const body = {
        product: "boleto",
        id: ["1"],
        kind: "webhook",
        type: "disponivel",
      };
      await validateBody(body).catch(() => {});
      expect(safeParseSpy).toHaveBeenCalledWith(body);
      safeParseSpy.mockRestore();
    });

    it("deve chamar InvalidFieldsError.fromZodError em caso de erro", async () => {
      const body = { product: "invalid" };
      await validateBody(body).catch(() => {});
      expect(spy).toHaveBeenCalled();
    });
  });
});
