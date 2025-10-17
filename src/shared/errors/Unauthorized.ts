import { ErrorResponse } from "./ErrorResponse";

export class UnauthorizedError extends ErrorResponse {
  constructor(
    public errors: string,
    public code: string = "UNAUTHORIZED",
  ) {
    super(code, 401, errors);
  }
}
