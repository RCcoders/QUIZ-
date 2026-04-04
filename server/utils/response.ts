/**
 * Standardized API response envelope.
 * Every API route should use ok() for success and fail() for errors.
 *
 * Shape: { success: boolean; data: T | null; error: string | null }
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function fail(error: string): ApiResponse<null> {
  return { success: false, data: null, error };
}
