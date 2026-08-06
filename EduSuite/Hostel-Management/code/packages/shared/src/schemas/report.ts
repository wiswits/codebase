import { z } from 'zod';
import { idSchema, dateSchema } from './common';

// Report types
export const reportTypeSchema = z.enum(['occupancy', 'vacancy', 'attendance', 'revenue']);
export type ReportType = z.infer<typeof reportTypeSchema>;

// Export format
export const exportFormatSchema = z.enum(['csv', 'xlsx']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

// Occupancy report
export const occupancyReportParamsSchema = z.object({
  hostelId: idSchema,
  level: z.enum(['floor', 'wing', 'building']).default('floor'),
  period: z.enum(['week', 'month', 'term']).default('month'),
});

export const occupancyReportItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  total: z.number(),
  occupied: z.number(),
  vacant: z.number(),
  reserved: z.number().optional(),
  blocked: z.number().optional(),
  rate: z.number(),
});

export const occupancyReportSchema = z.object({
  total: z.number(),
  occupied: z.number(),
  vacant: z.number(),
  reserved: z.number().optional(),
  blocked: z.number().optional(),
  occupancyRate: z.number(),
  details: z.array(occupancyReportItemSchema),
});

// Vacancy report
export const vacancyReportParamsSchema = z.object({
  hostelId: idSchema,
  roomType: z.string().optional(),
  gender: z.string().optional(),
});

export const vacancyReportSchema = z.object({
  totalRooms: z.number(),
  totalBeds: z.number(),
  availableBeds: z.number(),
  availabilityRate: z.number(),
  byRoomType: z.array(
    z.object({
      type: z.string(),
      total: z.number(),
      available: z.number(),
    })
  ),
  byFloor: z.array(
    z.object({
      floor: z.string(),
      total: z.number(),
      available: z.number(),
    })
  ),
  availableRooms: z.array(
    z.object({
      roomNumber: z.string(),
      roomType: z.string(),
      floorNumber: z.number(),
      totalBeds: z.number(),
      availableBeds: z.number(),
    })
  ),
});

// Attendance report
export const attendanceReportParamsSchema = z.object({
  hostelId: idSchema,
  studentId: idSchema.optional(),
  from: dateSchema,
  to: dateSchema,
});

export const attendanceReportSchema = z.object({
  totalDays: z.number(),
  present: z.number(),
  absent: z.number(),
  onLeave: z.number(),
  late: z.number(),
  attendanceRate: z.number(),
  dailyTrend: z.array(
    z.object({
      date: z.string(),
      present: z.number(),
      absent: z.number(),
      onLeave: z.number(),
      late: z.number(),
    })
  ),
  distribution: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    })
  ),
  records: z.array(z.any()),
  studentSummary: z
    .array(
      z.object({
        studentId: idSchema,
        studentName: z.string(),
        total: z.number(),
        present: z.number(),
        absent: z.number(),
        rate: z.number(),
      })
    )
    .optional(),
});

// Revenue report
export const revenueReportParamsSchema = z.object({
  hostelId: idSchema,
  term: z.string().default('current'),
});

export const revenueReportSchema = z.object({
  totalRevenue: z.number(),
  collected: z.number(),
  pending: z.number(),
  collectionRate: z.number(),
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
      collection: z.number(),
    })
  ),
  distribution: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  ),
  details: z.array(
    z.object({
      studentId: idSchema,
      studentName: z.string(),
      roomNumber: z.string(),
      rent: z.number(),
      deposits: z.number(),
      damage: z.number(),
      paid: z.number(),
      balance: z.number(),
    })
  ),
});

// Export request
export const exportReportSchema = z.object({
  reportType: reportTypeSchema,
  format: exportFormatSchema,
  filters: z.record(z.unknown()),
});

// Types
export type OccupancyReportParams = z.infer<typeof occupancyReportParamsSchema>;
export type OccupancyReport = z.infer<typeof occupancyReportSchema>;
export type OccupancyReportItem = z.infer<typeof occupancyReportItemSchema>;
export type VacancyReportParams = z.infer<typeof vacancyReportParamsSchema>;
export type VacancyReport = z.infer<typeof vacancyReportSchema>;
export type AttendanceReportParams = z.infer<typeof attendanceReportParamsSchema>;
export type AttendanceReport = z.infer<typeof attendanceReportSchema>;
export type RevenueReportParams = z.infer<typeof revenueReportParamsSchema>;
export type RevenueReport = z.infer<typeof revenueReportSchema>;
export type ExportReport = z.infer<typeof exportReportSchema>;