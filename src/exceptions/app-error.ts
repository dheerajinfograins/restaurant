export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: unknown
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
