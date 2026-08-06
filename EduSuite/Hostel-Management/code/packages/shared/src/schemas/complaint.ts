import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

// Complaint category
export const complaintCategorySchema = z.enum([
  'electrical',
  'plumbing',
  'furniture',
  'cleanliness',
  'other',
]);
export type ComplaintCategory = z.infer<typeof complaintCategorySchema>;

// Complaint status
export const complaintStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
]);
export type ComplaintStatus = z.infer<typeof complaintStatusSchema>;

// Complaint schema
export const complaintSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  hostelId: idSchema,
  raisedBy: idSchema,
  category: complaintCategorySchema,
  description: z.string().min(1).max(1000),
  photoKeys: z.array(z.string()).default([]),
  status: complaintStatusSchema,
  assignedTo: idSchema.optional().nullable(),
  resolvedAt: timestampSchema.optional().nullable(),
  closedAt: timestampSchema.optional().nullable(),
  createdAt: timestampSchema,
});

export const createComplaintSchema = z.object({
  category: complaintCategorySchema,
  description: z.string().min(1).max(1000),
  photoKeys: z.array(z.string()).optional().default([]),
});

export const updateComplaintStatusSchema = z.object({
  status: complaintStatusSchema,
});

export const assignComplaintSchema = z.object({
  userId: idSchema,
});

// Upload URL schema
export const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^(image\/(jpeg|png|webp))$/),
});

export const uploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresIn: z.number(),
});

// Types
export type Complaint = z.infer<typeof complaintSchema>;
export type CreateComplaint = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintStatus = z.infer<typeof updateComplaintStatusSchema>;
export type AssignComplaint = z.infer<typeof assignComplaintSchema>;
export type UploadUrl = z.infer<typeof uploadUrlSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;