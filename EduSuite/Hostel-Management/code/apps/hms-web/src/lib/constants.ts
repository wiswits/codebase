// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/hms/v1',
  APEX_URL: import.meta.env.VITE_APEX_URL || '/apex/v1',
  TIMEOUT: 30000,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  PARENT_APPROVAL_DEFAULT: true,
  ATTENDANCE_CUTOFF_TIME: '22:00',
  QR_ATTENDANCE_ENABLED: false,
  AUTO_CLOSE_COMPLAINT_DAYS: 7,
  BED_RESERVATION_TTL_HOURS: 24,
} as const;

// Bed Status
export const BED_STATUS = {
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  BLOCKED: 'blocked',
  RESERVED: 'reserved',
} as const;

export type BedStatus = typeof BED_STATUS[keyof typeof BED_STATUS];

export const BED_STATUS_COLORS = {
  [BED_STATUS.VACANT]: 'bg-apex-ivory border-2 border-dashed border-gray-300',
  [BED_STATUS.OCCUPIED]: 'bg-apex-navy text-white',
  [BED_STATUS.BLOCKED]: 'bg-apex-grey text-white',
  [BED_STATUS.RESERVED]: 'bg-apex-gold text-white',
} as const;

export const BED_STATUS_LABELS = {
  [BED_STATUS.VACANT]: 'Vacant',
  [BED_STATUS.OCCUPIED]: 'Occupied',
  [BED_STATUS.BLOCKED]: 'Blocked',
  [BED_STATUS.RESERVED]: 'Reserved',
} as const;

// Room Types
export const ROOM_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  DORM: 'dorm',
} as const;

export type RoomType = typeof ROOM_TYPES[keyof typeof ROOM_TYPES];

export const ROOM_TYPE_LABELS = {
  [ROOM_TYPES.SINGLE]: 'Single',
  [ROOM_TYPES.DOUBLE]: 'Double',
  [ROOM_TYPES.TRIPLE]: 'Triple',
  [ROOM_TYPES.DORM]: 'Dormitory',
} as const;

// Complaint Categories
export const COMPLAINT_CATEGORIES = {
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  FURNITURE: 'furniture',
  CLEANLINESS: 'cleanliness',
  OTHER: 'other',
} as const;

export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[keyof typeof COMPLAINT_CATEGORIES];

export const COMPLAINT_CATEGORY_LABELS = {
  [COMPLAINT_CATEGORIES.ELECTRICAL]: 'Electrical',
  [COMPLAINT_CATEGORIES.PLUMBING]: 'Plumbing',
  [COMPLAINT_CATEGORIES.FURNITURE]: 'Furniture',
  [COMPLAINT_CATEGORIES.CLEANLINESS]: 'Cleanliness',
  [COMPLAINT_CATEGORIES.OTHER]: 'Other',
} as const;

// Complaint Status
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type ComplaintStatus = typeof COMPLAINT_STATUS[keyof typeof COMPLAINT_STATUS];

// Leave Status
export const LEAVE_STATUS = {
  PENDING_PARENT: 'pending_parent',
  PENDING_WARDEN: 'pending_warden',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  ON_LEAVE: 'on_leave',
  LATE: 'late',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// Hostel Types
export const HOSTEL_TYPES = {
  BOYS: 'boys',
  GIRLS: 'girls',
  COED: 'coed',
  STAFF: 'staff',
} as const;

export type HostelType = typeof HOSTEL_TYPES[keyof typeof HOSTEL_TYPES];

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_CURSOR: null,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  TIME: 'HH:mm',
} as const;

// Currency
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  DECIMALS: 0,
  LOCALE: 'en-IN',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hms_auth_token',
  USER_PREFERENCES: 'hms_user_prefs',
  THEME: 'hms_theme',
  LANGUAGE: 'hms_language',
} as const;

// Routes
export const ROUTES = {
  DASHBOARD: '/dashboard',
  HOSTELS: '/hostels',
  HOSTEL_DETAILS: '/hostels/:id',
  BED_GRID: '/hostels/:id/beds',
  ALLOCATE: '/allocate',
  TRANSFERS: '/transfers',
  ATTENDANCE: '/attendance',
  LEAVE: '/leave',
  COMPLAINTS: '/complaints',
  REPORTS: '/reports',
  LOGIN: '/login',
  LOGOUT: '/logout',
  UNAUTHORIZED: '/unauthorized',
} as const;

// Error Codes
export const ERROR_CODES = {
  BED_ALREADY_ALLOCATED: 'BED_ALREADY_ALLOCATED',
  STUDENT_ALREADY_ALLOCATED: 'STUDENT_ALREADY_ALLOCATED',
  FEE_NOT_CLEARED: 'FEE_NOT_CLEARED',
  GENDER_MISMATCH: 'GENDER_MISMATCH',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];