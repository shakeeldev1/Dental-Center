import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin wrapper around fetch for calling the NestJS backend. Automatically
 * attaches the current Supabase access token as a Bearer credential.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  // Leave Content-Type unset for FormData so the browser sets the multipart boundary.
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body as { message?: string }).message) || res.statusText || 'Request failed';
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : String(message));
  }

  return body as T;
}
