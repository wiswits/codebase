import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

// Leave status
export const leaveStatusSchema = z.enum([
  'pending_parent',
  'pending_warden',
  'approved',
  'rejected',
  'cancelled',
]);
export type LeaveStatus = z.infer<typeof leaveStatusSchema>;

// Leave request schema
export const leaveRequestSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  hostelId: idSchema,
  apexStudentId: idSchema,
  fromTs: timestampSchema,
  toTs: timestampSchema,
  reason: z.string().min(1).max(500),
  status: leaveStatusSchema,
  parentDecidedBy: idSchema.optional().nullable(),
  parentDecidedAt: timestampSchema.optional().nullable(),
  wardenDecidedBy: idSchema.optional().nullable(),
  wardenDecidedAt: timestampSchema.optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  createdAt: timestampSchema,
});

export const createLeaveRequestSchema = z.object({
  apexStudentId: idSchema,
  fromTs: timestampSchema,
  toTs: timestampSchema,
  reason: z.string().min(1).max(500),
});

export const updateLeaveStatusSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

// Gate pass schema
export const gatePassSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  leaveId: idSchema,
  passCode: z.string(),
  validFrom: timestampSchema,
  validTo: timestampSchema,
  exitScannedAt: timestampSchema.optional().nullable(),
  entryScannedAt: timestampSchema.optional().nullable(),
});

export const createGatePassSchema = gatePassSchema.omit({
  id: true,
  orgId: true,
});

// Gate pass scan
export const gatePassScanSchema = z.object({
  direction: z.enum(['exit', 'entry']),
});

// Gate pass with leave details
export const gatePassWithLeaveSchema = gatePassSchema.extend({
  apexStudentId: idSchema,
  reason: z.string(),
  leaveStatus: leaveStatusSchema,
  hostelId: idSchema.optional(),
});

// Types
export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
export type CreateLeaveRequest = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveStatus = z.infer<typeof updateLeaveStatusSchema>;
export type GatePass = z.infer<typeof gatePassSchema>;
export type CreateGatePass = z.infer<typeof createGatePassSchema>;
export type GatePassScan = z.infer<typeof gatePassScanSchema>;
export type GatePassWithLeave = z.infer<typeof gatePassWithLeaveSchema>;

// Leave with gate pass
export const leaveWithGatePassSchema = leaveRequestSchema.extend({
  gatePass: gatePassSchema.optional(),
});

export type LeaveWithGatePass = z.infer<typeof leaveWithGatePassSchema>;