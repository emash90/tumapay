/**
 * HTTP Client Configuration
 * Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from './config';
import { handleApiError, isAuthError } from './errors';

/**
 * Token management utilities
 * Access token stored in memory (Zustand store), not localStorage
 * Refresh token stored in httpOnly cookie (managed by backend)
 */
let accessToken: string | null = null;

export const tokenManager = {
  get: (): string | null => {
    return accessToken;
  },

  set: (token: string): void => {
    accessToken = token;
  },

  remove: (): void => {
    accessToken = null;
  },

  exists: (): boolean => {
    return !!accessToken;
  },
};

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // Enable sending cookies for refresh token
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.get();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Flag to prevent multiple simultaneous refresh attempts
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

/**
 * Response interceptor - Handle errors and token expiration with auto-refresh
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the data directly for successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const apiError = handleApiError(error);

    // Handle authentication errors (token expired/invalid)
    // Skip auto-refresh for the refresh endpoint itself to prevent infinite loop
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
    if (isAuthError(apiError) && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await apiClient.post('/auth/refresh');
        const { accessToken } = response.data.data;

        // Update token in memory
        tokenManager.set(accessToken);

        // Update authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process all queued requests
        processQueue();

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(refreshError);
        tokenManager.remove();

        // Dispatch event for auth store to listen to
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'token_expired' },
          })
        );

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(apiError);
  }
);

/**
 * Generic API response wrapper
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

/**
 * Export the configured axios instance
 */
export default apiClient;
