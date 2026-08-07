import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  limit: number;
  total?: number;
}

export function createPaginatedResponse<T>(
  items: T[],
  limit: number,
  cursorField: keyof T = 'id' as keyof T
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore && data.length > 0 
    ? String(data[data.length - 1][cursorField]) 
    : undefined;

  return {
    data,
    nextCursor,
    hasMore,
    limit,
  };
}

export function encodeCursor(value: string | number): string {
  return Buffer.from(String(value)).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString();
}

export function getCursorCondition<T>(
  cursor: string | undefined,
  field: keyof T,
  direction: 'forward' = 'forward'
): ((qb: any) => any) | undefined {
  if (!cursor) return undefined;
  
  const decoded = decodeCursor(cursor);
  return (eb: any) => eb(field as any, '>', decoded);
}

export function getPaginationQuery<T>(
  query: any,
  params: PaginationParams,
  field: keyof T = 'id' as keyof T,
  direction: 'asc' | 'desc' = 'desc'
) {
  const { limit, cursor } = params;

  let q = query;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    q = q.where(field as any, direction === 'desc' ? '<' : '>', decoded);
  }

  q = q.orderBy(field as any, direction).limit(limit + 1);

  return q;
}

// Helper to get total count
export async function getTotalCount<T>(
  query: any,
  countField: string = 'id'
): Promise<number> {
  const result = await query
    .clearSelect()
    .clearOrderBy()
    .select((eb: any) => eb.fn.count(countField).as('count'))
    .executeTakeFirst();
  return Number(result?.count || 0);
}