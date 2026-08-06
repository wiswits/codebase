import { z } from 'zod';

// Base schemas
export const idSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const datetimeSchema = z.string().datetime({ offset: true });

// Pagination
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    nextCursor: z.string().optional(),
    hasMore: z.boolean(),
    limit: z.number(),
  });

// Error response
export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
});

// Success response
export const successSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// Types
export type Id = z.infer<typeof idSchema>;
export type Timestamp = z.infer<typeof timestampSchema>;
export type Date = z.infer<typeof dateSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type ErrorResponse = z.infer<typeof errorSchema>;
export type SuccessResponse = z.infer<typeof successSchema>;