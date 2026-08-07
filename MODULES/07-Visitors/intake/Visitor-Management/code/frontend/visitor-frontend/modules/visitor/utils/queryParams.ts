export interface VisitorQueryParams {
  search?: string;
  status?: string;
  visitorType?: string;
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export function buildQueryParams(
  params: VisitorQueryParams = {}
): string {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set(
      "search",
      params.search.trim()
    );
  }

  if (params.status?.trim()) {
    searchParams.set(
      "status",
      params.status.trim()
    );
  }

  if (params.visitorType?.trim()) {
    searchParams.set(
      "visitorType",
      params.visitorType.trim()
    );
  }

  if (
    params.page !== undefined &&
    params.page > 0
  ) {
    searchParams.set(
      "page",
      String(params.page)
    );
  }

  if (
    params.limit !== undefined &&
    params.limit > 0
  ) {
    searchParams.set(
      "limit",
      String(params.limit)
    );
  }

  if (params.fromDate?.trim()) {
    searchParams.set(
      "fromDate",
      params.fromDate.trim()
    );
  }

  if (params.toDate?.trim()) {
    searchParams.set(
      "toDate",
      params.toDate.trim()
    );
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export function getPageFromSearchParams(
  params: URLSearchParams
): number {
  const page = Number(params.get("page"));

  return Number.isInteger(page) && page > 0
    ? page
    : 1;
}

export function getLimitFromSearchParams(
  params: URLSearchParams,
  defaultLimit = 20
): number {
  const limit = Number(params.get("limit"));

  return Number.isInteger(limit) && limit > 0
    ? limit
    : defaultLimit;
}