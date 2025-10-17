export class ErrorResponse {
  constructor(
    public code: string,
    public statusCode: number,
    public error: any,
  ) {}

  json() {
    return {
      code: this.code,
      statusCode: this.statusCode,
      error: this.error,
    };
  }

  static internalServerErrorFromError(error: Error) {
    return new ErrorResponse("INTERNAL_SERVER_ERROR", 500, {
      errors: [(error as Error).message ?? "Erro interno do servidor"],
    });
  }
}
