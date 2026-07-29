import { ZodError } from 'zod';

/**
 * Standard service response interface for all service functions
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

/**
 * Standard error interface with categorization
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Error categories for consistent error handling
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Not found errors
  NOT_FOUND = 'NOT_FOUND',
  PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
  FACT_NOT_FOUND = 'FACT_NOT_FOUND',
  DATE_NOT_FOUND = 'DATE_NOT_FOUND',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Throwable error carrying a ServiceError code, for use inside
 * runServiceOperation
 */
export class NotFoundError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message);
    this.name = 'NotFoundError';
    this.code = code;
  }
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return { data, error: null };
}

/**
 * Create an error response
 */
export function createErrorResponse<T>(
  error: ServiceError,
): ServiceResponse<T> {
  return { data: null, error };
}

/**
 * Map SQLite errors to our standard error format.
 * expo-sqlite throws plain Errors; constraint failures are identified
 * by message content.
 */
export function mapDatabaseError(error: unknown): ServiceError {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('UNIQUE constraint failed') ||
    message.includes('CHECK constraint failed') ||
    message.includes('NOT NULL constraint failed')
  ) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Data violates database constraints',
      details: error,
    };
  }

  if (message.includes('FOREIGN KEY constraint failed')) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid reference - related resource not found',
      details: error,
    };
  }

  if (message.includes('no such table') || message.includes('no such column')) {
    return {
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
      details: error,
    };
  }

  return {
    code: ErrorCode.DATABASE_ERROR,
    message: message || 'Database operation failed',
    details: error,
  };
}

/**
 * Map Zod validation errors to our standard error format
 */
export function mapValidationError(error: ZodError): ServiceError {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    code: ErrorCode.VALIDATION_ERROR,
    message: `Validation failed: ${issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`,
    details: { issues },
  };
}

/**
 * Wrapper to run a synchronous service operation with consistent
 * error handling. Throw NotFoundError inside the operation to produce
 * a NOT_FOUND response.
 */
export function runServiceOperation<T>(
  operation: () => T,
  errorContext?: string,
): ServiceResponse<T> {
  try {
    return createSuccessResponse(operation());
  } catch (error) {
    let serviceError: ServiceError;

    if (error instanceof NotFoundError) {
      serviceError = { code: error.code, message: error.message };
    } else if (error instanceof ZodError) {
      serviceError = mapValidationError(error);
    } else {
      serviceError = mapDatabaseError(error);
    }

    if (errorContext) {
      serviceError.message = `${errorContext}: ${serviceError.message}`;
    }

    return createErrorResponse(serviceError);
  }
}
