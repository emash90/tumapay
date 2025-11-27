/**
 * API Error Handling Utilities
 */

import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  message?: string | string[];
}

/**
 * Extended error interface for mutation errors with axios response
 */
export interface MutationError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string | string[];
      error?: string;
    };
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public response?: ApiErrorResponse;

  constructor(message: string, statusCode: number, response?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Parse and format API errors into a consistent structure
 */
export function handleApiError(error: unknown): ApiError {
  // Axios error with response from server
  if (error instanceof AxiosError && error.response) {
    const statusCode = error.response.status;
    const data = error.response.data as ApiErrorResponse;

    // Handle message being string or string[]
    const message = data.message
      ? (Array.isArray(data.message) ? data.message.join(', ') : data.message)
      : undefined;

    return new ApiError(
      message || data.error || error.message || 'An error occurred',
      statusCode,
      data
    );
  }

  // Axios error without response (network error)
  if (error instanceof AxiosError && error.request) {
    return new ApiError(
      'Network error. Please check your connection.',
      0
    );
  }

  // Generic error
  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  // Unknown error
  return new ApiError('An unexpected error occurred', 500);
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: ApiError): boolean {
  return error.statusCode === 401;
}

/**
 * Check if error is a forbidden error
 */
export function isForbiddenError(error: ApiError): boolean {
  return error.statusCode === 403;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: ApiError): boolean {
  return error.statusCode === 400 || error.statusCode === 422;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: ApiError): boolean {
  return error.statusCode === 404;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: ApiError): boolean {
  return error.statusCode >= 500;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
