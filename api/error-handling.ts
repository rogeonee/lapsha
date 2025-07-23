import { PostgrestError } from '@supabase/supabase-js';
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
  // Validation errors (400-level)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication/Authorization errors (401/403-level)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Not found errors (404-level)
  NOT_FOUND = 'NOT_FOUND',
  PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
  FACT_NOT_FOUND = 'FACT_NOT_FOUND',
  DATE_NOT_FOUND = 'DATE_NOT_FOUND',

  // Database/Server errors (500-level)
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
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
 * Map Supabase/PostgreSQL errors to our standard error format
 */
export function mapSupabaseError(error: PostgrestError): ServiceError {
  // Handle specific PostgreSQL error codes
  switch (error.code) {
    case 'PGRST116': // No rows returned
    case '42P01': // Relation does not exist
      return {
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        details: error,
      };

    case '23505': // Unique violation
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Duplicate entry - resource already exists',
        details: error,
      };

    case '23503': // Foreign key violation
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid reference - related resource not found',
        details: error,
      };

    case '23514': // Check constraint violation
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Data violates database constraints',
        details: error,
      };

    case '42501': // Insufficient privilege (RLS policy violation)
      return {
        code: ErrorCode.FORBIDDEN,
        message: 'Access denied - insufficient permissions',
        details: error,
      };

    case '08000': // Connection exception
    case '08003': // Connection does not exist
    case '08006': // Connection failure
      return {
        code: ErrorCode.CONNECTION_ERROR,
        message: 'Database connection failed',
        details: error,
      };

    default:
      // Generic database error
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: error.message || 'Database operation failed',
        details: error,
      };
  }
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
 * Map generic errors to our standard error format
 */
export function mapGenericError(error: unknown): ServiceError {
  if (error instanceof Error) {
    return {
      code: ErrorCode.UNEXPECTED_ERROR,
      message: error.message,
      details: { stack: error.stack },
    };
  }

  return {
    code: ErrorCode.UNEXPECTED_ERROR,
    message: 'An unexpected error occurred',
    details: error,
  };
}

/**
 * Wrapper function to handle service operations with consistent error handling
 */
export async function handleServiceOperation<T>(
  operation: () => Promise<T>,
  errorContext?: string,
): Promise<ServiceResponse<T>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    let serviceError: ServiceError;

    if (error instanceof ZodError) {
      serviceError = mapValidationError(error);
    } else if (error && typeof error === 'object' && 'code' in error) {
      serviceError = mapSupabaseError(error as PostgrestError);
    } else {
      serviceError = mapGenericError(error);
    }

    // Add context if provided
    if (errorContext) {
      serviceError.message = `${errorContext}: ${serviceError.message}`;
    }

    return createErrorResponse(serviceError);
  }
}
