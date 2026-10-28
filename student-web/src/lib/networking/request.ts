import { API_URL } from '@/lib/config';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from './api-error';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Single fetch wrapper: Bearer token, JSON in/out, ApiError on failure.
 * ONLY a 401 on an authenticated call clears the session. Network errors, 429 and 5xx never log the user out.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, signal } = options;
  const token = auth ? useAuthStore.getState().token : null;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string | string[] };
    const list = Array.isArray(payload.message) ? payload.message : payload.message ? [payload.message] : [];
    if (response.status === 401 && token) useAuthStore.getState().clear();
    const fallback =
      response.status === 429 ? 'Too many requests. Please wait a moment and try again.'
      : response.status >= 500 ? 'Something went wrong on our side. Please try again.'
      : 'Request failed';
    throw new ApiError(response.status, list[0] ?? fallback, list);
  }
  return data as T;
}
