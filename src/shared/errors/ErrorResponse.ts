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
}
