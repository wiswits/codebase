import {
  ApiError,
  type ApiErrorBody,
} from "@/lib/api";

export interface RequestInterceptorOptions {
  headers?: HeadersInit;
  body?: BodyInit | null;
}

export function prepareRequest(
  options: RequestInit = {}
): RequestInit {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  };
}

export async function parseApiResponse<T>(
  response: Response
): Promise<T> {
  const contentType =
    response.headers.get("content-type") ?? "";

  let body: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    try {
      const text = await response.text();
      body = text || null;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody =
      body &&
      typeof body === "object"
        ? (body as ApiErrorBody)
        : undefined;

    throw new ApiError(
      errorBody?.message ??
        `Request failed with status ${response.status}.`,
      response.status,
      errorBody
    );
  }

  return body as T;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function isUnauthorizedError(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401
  );
}

export function isForbiddenError(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403
  );
}

export function isNotFoundError(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    error.status === 404
  );
}

export function isValidationError(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 400 ||
      error.status === 422)
  );
}

export function isNetworkError(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    error.status === 0
  );
}