// src/modules/observations/services/observationsApi.ts
//
// Shared frontend/API integration boundary (Section 19).
// Sunidhi's list components must go through this file (via the hooks),
// not read the mock array directly.
//
// Mock-first per Section 21: today this reads from mocks/. Flipping
// USE_MOCK to false (once the real backend is wired up) requires no
// component changes.

import { OBSERVATIONS_API_BASE } from "../constants/observation.constants";
import { MOCK_OBSERVATIONS } from "../mocks/observations.mock";
import {
  ApiError,
  Observation,
  ObservationListParams,
  ObservationListResult,
} from "../types/observation.types";

const USE_MOCK = true;

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function filterMockObservations(
  records: Observation[],
  params: ObservationListParams
): ObservationListResult {
  let result = [...records];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((o) =>
      `${o.content} ${o.studentName ?? ""} ${o.authorName ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }

  if (params.studentId) {
    result = result.filter((o) => o.studentId === params.studentId);
  }

  if (params.observationType) {
    result = result.filter((o) => o.observationType === params.observationType);
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: result.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  const res = await fetch(`${OBSERVATIONS_API_BASE}${path}${query}`);
  const body = await res.json();

  if (!res.ok || !body.success) {
    const err: ApiError = body?.error || {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong.",
    };
    const error = new Error(err.message) as Error & { code?: string };
    error.code = err.code;
    throw error;
  }

  return body.data as T;
}

export const observationsApi = {
  // GET /api/v1/student-observations
  async getObservations(
    params: ObservationListParams
  ): Promise<ObservationListResult> {
    if (USE_MOCK) {
      return mockDelay(filterMockObservations(MOCK_OBSERVATIONS, params));
    }
    return request<ObservationListResult>("", params as Record<string, string | number>);
  },

  // GET /api/v1/student-observations/:id
  async getObservation(id: number): Promise<Observation> {
    if (USE_MOCK) {
      const record = MOCK_OBSERVATIONS.find((o) => o.id === id);
      if (!record) {
        const error = new Error("Observation not found.") as Error & {
          code?: string;
        };
        error.code = "OBSERVATION_NOT_FOUND";
        throw error;
      }
      return mockDelay(record);
    }
    return request<Observation>(`/${id}`);
  },
};
