import type { ApiEnvelope } from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api';

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });

  const payload = (await response.json()) as ApiEnvelope<T> & { details?: unknown };
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}
