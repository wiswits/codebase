import { z } from 'zod';
import { idSchema, dateSchema, timestampSchema } from './common';

// Attendance status
export const attendanceStatusSchema = z.enum(['present', 'absent', 'on_leave', 'late']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// Attendance method
export const attendanceMethodSchema = z.enum(['manual', 'qr']);
export type AttendanceMethod = z.infer<typeof attendanceMethodSchema>;

// Attendance schema
export const attendanceSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  hostelId: idSchema,
  apexStudentId: idSchema,
  attendanceDate: dateSchema,
  status: attendanceStatusSchema,
  method: attendanceMethodSchema,
  markedBy: idSchema,
  markedAt: timestampSchema,
  deviceId: z.string().optional().nullable(),
});

export const createAttendanceSchema = attendanceSchema.omit({
  id: true,
  orgId: true,
  markedAt: true,
});

// Bulk attendance
export const attendanceRecordSchema = z.object({
  studentId: idSchema,
  status: attendanceStatusSchema,
});

export const createAttendanceBulkSchema = z.object({
  hostelId: idSchema,
  date: dateSchema,
  records: z.array(attendanceRecordSchema).min(1).max(200),
});

// QR scan
export const qrScanSchema = z.object({
  passCode: z.string().optional(),
  studentQr: z.string().optional(),
  deviceId: z.string().optional(),
});

// Roster
export const rosterItemSchema = z.object({
  studentId: idSchema,
  studentName: z.string(),
  roomNumber: z.string(),
  bedLabel: z.string(),
  status: attendanceStatusSchema.nullable(),
  attendanceId: idSchema.nullable(),
});

// Missing students
export const missingStudentSchema = z.object({
  studentId: idSchema,
  studentName: z.string(),
  roomNumber: z.string(),
  status: z.enum(['absent', 'on_leave']),
});

// Types
export type Attendance = z.infer<typeof attendanceSchema>;
export type CreateAttendance = z.infer<typeof createAttendanceSchema>;
export type CreateAttendanceBulk = z.infer<typeof createAttendanceBulkSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type QRScan = z.infer<typeof qrScanSchema>;
export type RosterItem = z.infer<typeof rosterItemSchema>;
export type MissingStudent = z.infer<typeof missingStudentSchema>;