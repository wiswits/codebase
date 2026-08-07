import type { APIResult } from '../types';

/**
 * Engineering Standards §4.2 requires all backend communication to go
 * through a centralized API/service layer, and that "the exact HTTP library
 * must follow the existing application convention."
 *
 * No existing convention was provided in Sunidhi's assigned scope, so this
 * is a minimal fetch-based client local to the Payroll Runs / Adjustments /
 * Payslips services. If WisWits already standardizes an HTTP client
 * elsewhere in the app, this file should be deleted and the services below
 * should import that shared client instead — that swap is outside Sunidhi's
 * scope to decide unilaterally (§37).
 */

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<APIResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      credentials: 'include',
    });

    const body = (await res.json()) as APIResult<T>;
    return body;
  } catch {
    return {
      success: false,
      message: 'Unable to reach the server. Check your connection and try again.',
    };
  }
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};
