/**
 * Custom Error Classes
 */

export class ApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`Application with id ${id} not found`);
    this.name = 'ApplicationNotFoundError';
  }
}

export class InvalidApplicationDataError extends Error {
  constructor(message: string) {
    super(`Invalid application data: ${message}`);
    this.name = 'InvalidApplicationDataError';
  }
}

export class ExcelServiceError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Excel service error: ${message}`);
    this.name = 'ExcelServiceError';
    this.cause = cause;
  }
}

