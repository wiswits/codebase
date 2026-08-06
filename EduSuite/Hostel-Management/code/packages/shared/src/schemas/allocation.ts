import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

// Allocation schema
export const allocationSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  bedId: idSchema,
  apexStudentId: idSchema,
  hostelId: idSchema,
  allocatedAt: timestampSchema,
  vacatedAt: timestampSchema.optional().nullable(),
  allocatedBy: idSchema,
  vacateReason: z.string().optional().nullable(),
});

export const createAllocationSchema = z.object({
  apexStudentId: idSchema,
  bedId: idSchema,
  effectiveFrom: timestampSchema.optional().default(() => new Date().toISOString()),
});

export const vacateAllocationSchema = z.object({
  reason: z.string().min(1).max(500),
  damageCharges: z.number().int().min(0).optional().default(0),
});

// Transfer schema
export const transferSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  allocationId: idSchema,
  requestedBedId: idSchema,
  requestedBy: idSchema,
  reason: z.string().min(1).max(500),
  status: z.enum(['pending', 'approved', 'rejected']),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: timestampSchema.optional().nullable(),
  approvedBedId: idSchema.optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  createdAt: timestampSchema,
});

export const createTransferSchema = z.object({
  allocationId: idSchema,
  requestedBedId: idSchema,
  reason: z.string().min(1).max(500),
});

export const approveTransferSchema = z.object({
  newBedId: idSchema.optional(),
});

export const rejectTransferSchema = z.object({
  reason: z.string().min(1),
});

// Types
export type Allocation = z.infer<typeof allocationSchema>;
export type CreateAllocation = z.infer<typeof createAllocationSchema>;
export type VacateAllocation = z.infer<typeof vacateAllocationSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type CreateTransfer = z.infer<typeof createTransferSchema>;
export type ApproveTransfer = z.infer<typeof approveTransferSchema>;
export type RejectTransfer = z.infer<typeof rejectTransferSchema>;

// Allocation with bed details
export const allocationWithBedSchema = allocationSchema.extend({
  bedLabel: z.string(),
  rentTier: z.string(),
  roomNumber: z.string(),
  roomType: z.string().optional(),
});

export type AllocationWithBed = z.infer<typeof allocationWithBedSchema>;

// Student residency
export const studentResidencySchema = z.object({
  allocation: allocationWithBedSchema.optional(),
  isResident: z.boolean(),
});

export type StudentResidency = z.infer<typeof studentResidencySchema>;