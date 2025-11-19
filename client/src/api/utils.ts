/**
 * API Utility Functions
 * Common patterns and helpers for API requests
 */

import type { AxiosResponse } from 'axios';
import apiClient from './client';
import type { ApiResponse } from './client';
import { handleApiError } from './errors';

/**
 * Generic GET request
 */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, { params });
    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Generic POST request
 */
export async function post<T, D = unknown>(url: string, data?: D): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data);
    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Generic PUT request
 */
export async function put<T, D = unknown>(url: string, data?: D): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data);
    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Generic PATCH request
 */
export async function patch<T, D = unknown>(url: string, data?: D): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data);
    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Generic DELETE request
 */
export async function del<T>(url: string): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url);
    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Download file from API
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Upload file to API
 */
export async function uploadFile<T>(
  url: string,
  file: File,
  fieldName: string = 'file',
  additionalData?: Record<string, unknown>
): Promise<T> {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data as T;
  } catch (error) {
    throw handleApiError(error);
  }
}
