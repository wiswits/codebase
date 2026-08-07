/**
 * HMS Status Constants
 * Single source of truth for all status values
 */

// ============================================
// Bed Status
// ============================================
export const BED_STATUS = {
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  BLOCKED: 'blocked',
  RESERVED: 'reserved',
} as const;

export type BedStatus = typeof BED_STATUS[keyof typeof BED_STATUS];

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  [BED_STATUS.VACANT]: 'Vacant',
  [BED_STATUS.OCCUPIED]: 'Occupied',
  [BED_STATUS.BLOCKED]: 'Blocked',
  [BED_STATUS.RESERVED]: 'Reserved',
};

export const BED_STATUS_COLORS: Record<BedStatus, string> = {
  [BED_STATUS.VACANT]: 'bg-green-100 text-green-800 border-green-300',
  [BED_STATUS.OCCUPIED]: 'bg-blue-100 text-blue-800 border-blue-300',
  [BED_STATUS.BLOCKED]: 'bg-gray-100 text-gray-800 border-gray-300',
  [BED_STATUS.RESERVED]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

export const BED_STATUS_ICONS: Record<BedStatus, string> = {
  [BED_STATUS.VACANT]: '○',
  [BED_STATUS.OCCUPIED]: '●',
  [BED_STATUS.BLOCKED]: '⊘',
  [BED_STATUS.RESERVED]: '◐',
};

// ============================================
// Attendance Status
// ============================================
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  ON_LEAVE: 'on_leave',
  LATE: 'late',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.ABSENT]: 'Absent',
  [ATTENDANCE_STATUS.ON_LEAVE]: 'On Leave',
  [ATTENDANCE_STATUS.LATE]: 'Late',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  [ATTENDANCE_STATUS.PRESENT]: 'bg-green-100 text-green-800',
  [ATTENDANCE_STATUS.ABSENT]: 'bg-red-100 text-red-800',
  [ATTENDANCE_STATUS.ON_LEAVE]: 'bg-blue-100 text-blue-800',
  [ATTENDANCE_STATUS.LATE]: 'bg-yellow-100 text-yellow-800',
};

// ============================================
// Leave Status
// ============================================
export const LEAVE_STATUS = {
  PENDING_PARENT: 'pending_parent',
  PENDING_WARDEN: 'pending_warden',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  [LEAVE_STATUS.PENDING_PARENT]: 'Awaiting Parent Approval',
  [LEAVE_STATUS.PENDING_WARDEN]: 'Awaiting Warden Approval',
  [LEAVE_STATUS.APPROVED]: 'Approved',
  [LEAVE_STATUS.REJECTED]: 'Rejected',
  [LEAVE_STATUS.CANCELLED]: 'Cancelled',
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  [LEAVE_STATUS.PENDING_PARENT]: 'bg-purple-100 text-purple-800',
  [LEAVE_STATUS.PENDING_WARDEN]: 'bg-yellow-100 text-yellow-800',
  [LEAVE_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [LEAVE_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [LEAVE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
};

// ============================================
// Complaint Status
// ============================================
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type ComplaintStatus = typeof COMPLAINT_STATUS[keyof typeof COMPLAINT_STATUS];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  [COMPLAINT_STATUS.OPEN]: 'Open',
  [COMPLAINT_STATUS.ASSIGNED]: 'Assigned',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUS.RESOLVED]: 'Resolved',
  [COMPLAINT_STATUS.CLOSED]: 'Closed',
};

export const COMPLAINT_STATUS_COLORS: Record<ComplaintStatus, string> = {
  [COMPLAINT_STATUS.OPEN]: 'bg-red-100 text-red-800',
  [COMPLAINT_STATUS.ASSIGNED]: 'bg-yellow-100 text-yellow-800',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [COMPLAINT_STATUS.RESOLVED]: 'bg-green-100 text-green-800',
  [COMPLAINT_STATUS.CLOSED]: 'bg-gray-100 text-gray-800',
};

export const COMPLAINT_STATUS_ORDER: ComplaintStatus[] = [
  COMPLAINT_STATUS.OPEN,
  COMPLAINT_STATUS.ASSIGNED,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.CLOSED,
];

// ============================================
// Complaint Categories
// ============================================
export const COMPLAINT_CATEGORIES = {
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  FURNITURE: 'furniture',
  CLEANLINESS: 'cleanliness',
  OTHER: 'other',
} as const;

export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[keyof typeof COMPLAINT_CATEGORIES];

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [COMPLAINT_CATEGORIES.ELECTRICAL]: 'Electrical',
  [COMPLAINT_CATEGORIES.PLUMBING]: 'Plumbing',
  [COMPLAINT_CATEGORIES.FURNITURE]: 'Furniture',
  [COMPLAINT_CATEGORIES.CLEANLINESS]: 'Cleanliness',
  [COMPLAINT_CATEGORIES.OTHER]: 'Other',
};

export const COMPLAINT_CATEGORY_ICONS: Record<ComplaintCategory, string> = {
  [COMPLAINT_CATEGORIES.ELECTRICAL]: '⚡',
  [COMPLAINT_CATEGORIES.PLUMBING]: '🔧',
  [COMPLAINT_CATEGORIES.FURNITURE]: '🪑',
  [COMPLAINT_CATEGORIES.CLEANLINESS]: '🧹',
  [COMPLAINT_CATEGORIES.OTHER]: '📝',
};

// ============================================
// Room Types
// ============================================
export const ROOM_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  DORM: 'dorm',
} as const;

export type RoomType = typeof ROOM_TYPES[keyof typeof ROOM_TYPES];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [ROOM_TYPES.SINGLE]: 'Single',
  [ROOM_TYPES.DOUBLE]: 'Double',
  [ROOM_TYPES.TRIPLE]: 'Triple',
  [ROOM_TYPES.DORM]: 'Dormitory',
};

export const ROOM_TYPE_CAPACITY: Record<RoomType, number> = {
  [ROOM_TYPES.SINGLE]: 1,
  [ROOM_TYPES.DOUBLE]: 2,
  [ROOM_TYPES.TRIPLE]: 3,
  [ROOM_TYPES.DORM]: 4,
};

// ============================================
// Hostel Types
// ============================================
export const HOSTEL_TYPES = {
  BOYS: 'boys',
  GIRLS: 'girls',
  COED: 'coed',
  STAFF: 'staff',
} as const;

export type HostelType = typeof HOSTEL_TYPES[keyof typeof HOSTEL_TYPES];

export const HOSTEL_TYPE_LABELS: Record<HostelType, string> = {
  [HOSTEL_TYPES.BOYS]: 'Boys Hostel',
  [HOSTEL_TYPES.GIRLS]: 'Girls Hostel',
  [HOSTEL_TYPES.COED]: 'Co-ed Hostel',
  [HOSTEL_TYPES.STAFF]: 'Staff Hostel',
};

// ============================================
// Transfer Status
// ============================================
export const TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type TransferStatus = typeof TRANSFER_STATUS[keyof typeof TRANSFER_STATUS];

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  [TRANSFER_STATUS.PENDING]: 'Pending',
  [TRANSFER_STATUS.APPROVED]: 'Approved',
  [TRANSFER_STATUS.REJECTED]: 'Rejected',
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  [TRANSFER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TRANSFER_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [TRANSFER_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

// ============================================
// Payment Status
// ============================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL: 'partial',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.PARTIAL]: 'Partial',
};

// ============================================
// Notification Types
// ============================================
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  [NOTIFICATION_TYPES.INFO]: 'bg-blue-100 text-blue-800 border-blue-300',
  [NOTIFICATION_TYPES.SUCCESS]: 'bg-green-100 text-green-800 border-green-300',
  [NOTIFICATION_TYPES.WARNING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [NOTIFICATION_TYPES.ERROR]: 'bg-red-100 text-red-800 border-red-300',
};

// ============================================
// Event Types
// ============================================
export const EVENT_TYPES = {
  ALLOCATION_CREATED: 'allocation_created',
  ALLOCATION_VACATED: 'allocation_vacated',
  ATTENDANCE_MARKED: 'attendance_marked',
  LEAVE_REQUESTED: 'leave_requested',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  COMPLAINT_CREATED: 'complaint_created',
  COMPLAINT_RESOLVED: 'complaint_resolved',
  COMPLAINT_ASSIGNED: 'complaint_assigned',
  TRANSFER_REQUESTED: 'transfer_requested',
  TRANSFER_APPROVED: 'transfer_approved',
  TRANSFER_REJECTED: 'transfer_rejected',
  STUDENT_ABSENT: 'student_absent',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];