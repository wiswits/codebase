  import { PMS_REAL_API_BASE_URL } from "../constants";
  import type { APIResponse } from "../types";

  /**
   * Centralized HTTP access point for the PMS module (Engineering Standards §4.2).
   * Components and hooks must never call fetch() directly or hardcode API
   * paths — everything routes through here (or through the mock API during
   * independent development, see mocks/mock-api.ts).
   *
   * This wrapper intentionally does not choose an HTTP library on the team's
   * behalf: it uses the native fetch API, which every WisWits frontend
   * environment already has. If the existing repository standardizes a
   * different HTTP library (e.g. axios), swap the implementation here only —
   * no calling code needs to change.
   */

  export interface RequestOptions {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
  }

  export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${PMS_REAL_API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
              body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });

      const json = (await response.json()) as APIResponse<T>;
      console.log("API JSON:", json);
console.log("HTTP Status:", response.status);

      if (!response.ok && json.success !== false) {
        // Defensive fallback in case the backend doesn't yet follow the
        // shared response contract from Engineering Standards §22/§26.
        return {
          success: false,
          error: {
            code: "UNEXPECTED_RESPONSE",
            message: "The server returned an unexpected response.",
          },
        };
      }

      return json;
    } catch {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Unable to reach the server. Check your connection and try again.",
        },
      };
    }
  }
