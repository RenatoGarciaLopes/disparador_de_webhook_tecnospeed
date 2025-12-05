import { ErrorResponse } from "./ErrorResponse";

export class AlreadyProcessedError extends ErrorResponse {
  constructor(
    public messagePtBr: string = "Você já processou esses serviços recentemente.",
    public code: string = "ALREADY_PROCESSED",
  ) {
    super(code, 409, { errors: [messagePtBr] });
  }
}
