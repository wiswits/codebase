import {
  ALUMNI_API
} from "../constants/alumni.constants";

import {
  buildAlumniQuery
} from "../utils/alumniQuery";

import type {
  Alumni,
  AlumniBatch,
  AlumniListData,
  AlumniQuery,
  AlumniStats,
  ApiSuccess
} from "../types/alumni.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000/api/v1";

export class AlumniApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);

    this.name = "AlumniApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json"
      },

      cache: "no-store"
    }
  );

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new AlumniApiError(
      "The server returned an invalid response.",
      response.status
    );
  }

  if (!response.ok) {
    const failure = payload as {
      error?: {
        code?: string;
        message?: string;
      };
    };

    throw new AlumniApiError(
      failure.error?.message ??
        "Unable to complete the request.",
      response.status,
      failure.error?.code
    );
  }

  const success =
    payload as ApiSuccess<T>;

  if (!success.success) {
    throw new AlumniApiError(
      "The server returned an unexpected response.",
      response.status
    );
  }

  return success.data;
}

export function fetchAlumni(
  query: AlumniQuery = {}
): Promise<AlumniListData> {
  return request<AlumniListData>(
    `${ALUMNI_API.directory}${buildAlumniQuery(
      query
    )}`
  );
}

export function fetchAlumniProfile(
  id: number | string
): Promise<Alumni> {
  return request<Alumni>(
    ALUMNI_API.profile(id)
  );
}

export function fetchAlumniStats():
Promise<AlumniStats> {
  return request<AlumniStats>(
    ALUMNI_API.stats
  );
}

export function fetchAlumniBatches():
Promise<AlumniBatch[]> {
  return request<AlumniBatch[]>(
    ALUMNI_API.batches
  );
}