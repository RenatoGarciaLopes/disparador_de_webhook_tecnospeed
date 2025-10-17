import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { validateBody } from "./validate-body";

describe("[HTTP Middleware] /reenviar - validateBody", () => {
  const fake = new InvalidFieldsError({ errors: ["teste"] }, "INVALID_FIELDS");
  const spy = jest
    .spyOn(InvalidFieldsError, "fromZodError")
    .mockReturnValue(fake);

  it("deve lançar um erro se nenhum `campo` for enviado", async () => {
    const noBody = {};
    await expect(validateBody(noBody)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `product` não seja um enum válido", async () => {
    const bodyNoProduct = {
      id: ["1"],
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(bodyNoProduct)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);

    const bodyInvalidProduct = {
      product: "invalid",
      id: ["1"],
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(bodyInvalidProduct)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `id` não seja um array", async () => {
    const bodyNoId = {
      product: "boleto",
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(bodyNoId)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);

    const bodyInvalidId = {
      product: "boleto",
      id: "1",
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(bodyInvalidId)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `id` não seja um array de números inteiros positivos", async () => {
    const body = {
      product: "boleto",
      id: ["1", "2", "3", "4", "-5", "6", "7", "a", "8", "10a"],
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(body)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `id` tenha mais de 30 itens", async () => {
    const body = {
      product: "boleto",
      id: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
      ],
      kind: "webhook",
      type: "disponivel",
    };
    await expect(validateBody(body)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `kind` não seja um enum válido", async () => {
    const bodyNoKind = {
      product: "boleto",
      id: ["1"],
      type: "disponivel",
    };
    await expect(validateBody(bodyNoKind)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);

    const bodyInvalidKind = {
      product: "boleto",
      id: ["1"],
      kind: "invalid",
      type: "disponivel",
    };
    await expect(validateBody(bodyInvalidKind)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve lançar um erro caso o `type` não seja um enum válido", async () => {
    const bodyNoType = {
      product: "boleto",
      id: ["1"],
      kind: "webhook",
    };
    await expect(validateBody(bodyNoType)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);

    const bodyInvalidType = {
      product: "boleto",
      id: ["1"],
      kind: "webhook",
      type: "invalid",
    };
    await expect(validateBody(bodyInvalidType)).rejects.toBe(fake);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("deve transformar o body em um objeto com os campos transformados", async () => {
    const body = {
      product: "boleto",
      id: ["1", "2", "3"],
      kind: "webhook",
      type: "disponivel",
    };

    await expect(validateBody(body)).resolves.toEqual({
      product: "BOLETO",
      id: [1, 2, 3],
      kind: "webhook",
      type: "DISPONIVEL",
    });
  });
});
