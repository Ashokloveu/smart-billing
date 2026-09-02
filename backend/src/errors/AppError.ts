export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    isOperational = true,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource was not found') {
    super(404, 'RESOURCE_NOT_FOUND', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request payload', errors?: Array<{ field: string; message: string }>) {
    super(400, 'BAD_REQUEST', message, true, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource state conflict') {
    super(409, 'CONFLICT', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: Array<{ field: string; message: string }>) {
    super(422, 'VALIDATION_FAILED', message, true, errors);
  }
}
