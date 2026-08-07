const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL || "http://localhost:5000"
    : "";

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: unknown;
}

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,

      // Required when authentication uses cookies.
      credentials: "include",

      // Visitor data should always reflect the latest backend state.
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? error.message
        : "Unable to connect to the server.",
      0
    );
  }

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

export { API_BASE_URL };