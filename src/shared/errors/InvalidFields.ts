import { z } from "zod";
import { ErrorResponse } from "./ErrorResponse";

type Properties<T> = Record<string, T>;
type IFError = {
  errors?: string[];
  properties?: Properties<IFError>;
};

export class InvalidFieldsError extends ErrorResponse {
  constructor(
    public error: IFError,
    public code: string = "INVALID_FIELDS",
  ) {
    super(code, 400, error);
  }

  static fromZodError(error: z.ZodError) {
    const errors = z.treeifyError(error);
    return new InvalidFieldsError(errors as any, "INVALID_FIELDS");
  }
}
