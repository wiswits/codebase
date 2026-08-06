import { PaginationQuery } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Normalizes raw query-string pagination params into safe, bounded values.
 * Prevents unbounded/negative page sizes from being passed to the
 * repository layer.
 */
export function parsePagination(query: Record<string, any>): Required<PaginationQuery> {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limitRaw = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(limitRaw, 1), MAX_LIMIT);
  const sortOrder: 'asc' | 'desc' = query.sortOrder === 'desc' ? 'desc' : 'asc';
  const sortBy = typeof query.sortBy === 'string' && query.sortBy.trim() ? query.sortBy.trim() : 'created_at';

  return { page, limit, sortBy, sortOrder };
}

export function buildTotalPages(total: number, limit: number): number {
  return limit > 0 ? Math.ceil(total / limit) : 0;
}
