import { z } from "zod";
import { InvalidFieldsError } from "./InvalidFields";

describe("InvalidFieldsError", () => {
  it("deve criar uma instância da classe baseado no erro de validação zod", () => {
    jest.spyOn(z, "treeifyError").mockReturnValue({
      errors: [],
      properties: {
        name: {
          errors: ["Nome deve ser uma string"],
        },
      },
    } as any);

    const error = InvalidFieldsError.fromZodError(
      new z.ZodError([
        {
          code: "invalid_type",
          expected: "string",
          path: ["name"],
          message: "Nome deve ser uma string",
        },
      ]),
    );

    expect(z.treeifyError).toHaveBeenCalled();
    expect(error).toBeInstanceOf(InvalidFieldsError);
    expect(error.code).toEqual("INVALID_FIELDS");
    expect(error.error).toEqual({
      errors: [],
      properties: {
        name: {
          errors: ["Nome deve ser uma string"],
        },
      },
    });
  });
});
