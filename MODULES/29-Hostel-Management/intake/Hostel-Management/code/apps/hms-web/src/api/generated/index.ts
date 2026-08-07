// Central export for all generated API clients
export * from './hierarchy';
export * from './allocation';
export * from './attendance';
export * from './leave';
export * from './complaints';

// Re-export shared types
export type { 
  Hostel, 
  Building, 
  Wing, 
  Floor, 
  Room, 
  Bed,
  CreateHostel,
  UpdateHostel,
  BedStatus 
} from '@shared/schemas/hostel';

export type {
  Allocation,
  CreateAllocation,
  Transfer,
  VacateAllocation,
} from '@shared/schemas/allocation';

export type {
  Attendance,
  CreateAttendanceBulk,
  AttendanceStatus,
} from '@shared/schemas/attendance';

export type {
  LeaveRequest,
  CreateLeaveRequest,
  GatePass,
  LeaveStatus,
} from '@shared/schemas/leave';

export type {
  Complaint,
  CreateComplaint,
  ComplaintStatus,
  ComplaintCategory,
} from '@shared/schemas/complaint';