/**
 * API Module Exports
 * Central export point for all API functionality
 */

// Core client and utilities
export { default as apiClient, tokenManager } from './client';
export type { ApiResponse } from './client';

// HTTP methods
export { get, post, put, patch, del, buildQueryString, downloadFile, uploadFile } from './utils';

// Configuration
export { API_CONFIG, API_ENDPOINTS } from './config';

// Error handling
export {
  ApiError,
  handleApiError,
  isAuthError,
  isForbiddenError,
  isValidationError,
  isNotFoundError,
  isServerError,
  getErrorMessage,
} from './errors';
export type { ApiErrorResponse } from './errors';

// Services
export { authService } from './services/auth.service';
