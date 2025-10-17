import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { validateBody } from "./validate-body";

describe("[HTTP Middleware] /protocolo - validateBody", () => {
  const fake = new InvalidFieldsError({ errors: ["teste"] }, "INVALID_FIELDS");
  const spy = jest
    .spyOn(InvalidFieldsError, "fromZodError")
    .mockReturnValue(fake);

  it("deve lançar um erro se nenhum `campo` for enviado", async () => {
    const noBody = {};
    await expect(validateBody(noBody)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `start_date` seja maior que o `end_date`", async () => {
    const invalidBody = {
      start_date: "2021-01-10",
      end_date: "2021-01-01",
    };

    await expect(validateBody(invalidBody)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso a diferença entre `start_date` e `end_date` seja maior que 31 dias", async () => {
    const invalidBody = {
      start_date: "2021-01-01",
      end_date: "2021-02-02",
    };

    await expect(validateBody(invalidBody)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `product` não seja um enum válido", async () => {
    const bodyInvalidProduct = {
      start_date: "2021-01-01",
      end_date: "2021-01-10",
      product: "invalid",
    };
    await expect(validateBody(bodyInvalidProduct)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `id` não seja um array", async () => {
    const bodyInvalidId = {
      start_date: "2021-01-01",
      end_date: "2021-01-10",
      id: "1",
    };
    await expect(validateBody(bodyInvalidId)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `id` não seja um array de números inteiros positivos", async () => {
    const body = {
      start_date: "2021-01-01",
      end_date: "2021-01-10",
      id: ["1", "2", "3", "4", "-5", "6", "7", "a", "8", "10a"],
    };
    await expect(validateBody(body)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `kind` não seja um enum válido", async () => {
    const bodyInvalidKind = {
      start_date: "2021-01-01",
      end_date: "2021-01-10",
      kind: "invalid",
    };
    await expect(validateBody(bodyInvalidKind)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `type` não seja um enum válido", async () => {
    const bodyInvalidType = {
      start_date: "2021-01-01",
      end_date: "2021-01-10",
      type: "invalid",
    };
    await expect(validateBody(bodyInvalidType)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve transformar o body em um objeto com os campos transformados", async () => {
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
