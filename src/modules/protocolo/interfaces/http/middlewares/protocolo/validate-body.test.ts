import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { validateBody } from "./validate-body";

describe("[HTTP Middleware] /protocolo - validateBody", () => {
  const fake = new InvalidFieldsError({ errors: ["teste"] }, "INVALID_FIELDS");
  const spy = jest
    .spyOn(InvalidFieldsError, "fromZodError")
    .mockReturnValue(fake);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Erros manuais (validação pré-Zod)", () => {
    it("deve lançar um erro se nenhum `campo` for enviado", async () => {
      const noBody = {};
      await expect(validateBody(noBody)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("deve lançar um erro caso `start_date` > `end_date`", async () => {
      const invalidBody = {
        start_date: "2021-01-10",
        end_date: "2021-01-01",
      };
      await expect(validateBody(invalidBody)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("deve lançar um erro caso a diferença entre `start_date` e `end_date` seja > 31 dias", async () => {
      const invalidBody = {
        start_date: "2021-01-01",
        end_date: "2021-02-02",
      };
      await expect(validateBody(invalidBody)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("deve lançar um erro caso `id` não seja um array", async () => {
      const bodyInvalidId = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        id: "1",
      };
      await expect(validateBody(bodyInvalidId)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("deve lançar um erro caso `id` contenha valores inválidos", async () => {
      const body = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        id: ["1", "2", "-3", "a"],
      };
      await expect(validateBody(body)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("deve lançar um erro caso campos extras sejam enviados", async () => {
      const body = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        extra: "not allowed",
      };
      await expect(validateBody(body)).rejects.toBeInstanceOf(
        InvalidFieldsError,
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("Erros via Zod (fromZodError)", () => {
    it("deve lançar um erro caso `product` não seja válido", async () => {
      const bodyInvalidProduct = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        product: "invalid",
      };
      await expect(validateBody(bodyInvalidProduct)).rejects.toBe(fake);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("deve lançar um erro caso `kind` não seja válido", async () => {
      const bodyInvalidKind = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        kind: "invalid",
      };
      await expect(validateBody(bodyInvalidKind)).rejects.toBe(fake);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("deve lançar um erro caso `type` não seja válido", async () => {
      const bodyInvalidType = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        type: "invalid",
      };
      await expect(validateBody(bodyInvalidType)).rejects.toBe(fake);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validação e transformação do body", () => {
    it("deve transformar o body em um objeto com os campos normalizados", async () => {
      const body = {
        start_date: "2021-01-01",
        end_date: "2021-01-10",
        product: "boleto",
        id: ["1", "2", "3"],
        kind: "webhook",
        type: "disponivel",
      };

      await expect(validateBody(body)).resolves.toEqual({
        start_date: new Date("2021-01-01"),
        end_date: new Date("2021-01-10"),
        product: "BOLETO",
        id: [1, 2, 3],
        kind: "webhook",
        type: "DISPONIVEL",
      });
    });
  });
});
