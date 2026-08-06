/**
 * HMS Permission Constants
 * Single source of truth for all permissions
 * Used across frontend, backend, and shared packages
 */

export const PERMISSIONS = {
  // ============================================
  // Hierarchy Management
  // ============================================
  HOSTEL_CREATE: 'hms:hostel:create:org',
  HOSTEL_READ: 'hms:hostel:read:org',
  HOSTEL_UPDATE: 'hms:hostel:update:org',
  HOSTEL_DELETE: 'hms:hostel:delete:org',
  
  BUILDING_CREATE: 'hms:building:create:org',
  BUILDING_READ: 'hms:building:read:org',
  BUILDING_UPDATE: 'hms:building:update:org',
  BUILDING_DELETE: 'hms:building:delete:org',
  
  WING_CREATE: 'hms:wing:create:org',
  WING_READ: 'hms:wing:read:org',
  WING_UPDATE: 'hms:wing:update:org',
  WING_DELETE: 'hms:wing:delete:org',
  
  FLOOR_CREATE: 'hms:floor:create:org',
  FLOOR_READ: 'hms:floor:read:org',
  FLOOR_UPDATE: 'hms:floor:update:org',
  FLOOR_DELETE: 'hms:floor:delete:org',
  
  ROOM_CREATE: 'hms:room:create:org',
  ROOM_READ: 'hms:room:read:org',
  ROOM_UPDATE: 'hms:room:update:org',
  ROOM_DELETE: 'hms:room:delete:org',
  
  BED_CREATE: 'hms:bed:create:org',
  BED_READ: 'hms:bed:read:org',
  BED_UPDATE: 'hms:bed:update:org',
  BED_DELETE: 'hms:bed:delete:org',
  
  // ============================================
  // Allocation Management
  // ============================================
  ALLOCATION_CREATE: 'hms:allocation:create:hostel',
  ALLOCATION_READ: 'hms:allocation:read:hostel',
  ALLOCATION_UPDATE: 'hms:allocation:update:hostel',
  ALLOCATION_DELETE: 'hms:allocation:delete:hostel',
  ALLOCATION_APPROVE: 'hms:allocation:approve:hostel',
  
  // ============================================
  // Transfer Management
  // ============================================
  TRANSFER_CREATE: 'hms:transfer:create:own',
  TRANSFER_READ: 'hms:transfer:read:hostel',
  TRANSFER_APPROVE: 'hms:transfer:approve:hostel',
  
  // ============================================
  // Attendance Management
  // ============================================
  ATTENDANCE_CREATE: 'hms:attendance:create:hostel',
  ATTENDANCE_READ: 'hms:attendance:read:hostel',
  ATTENDANCE_UPDATE: 'hms:attendance:update:hostel',
  ATTENDANCE_DELETE: 'hms:attendance:delete:hostel',
  
  // ============================================
  // Leave Management
  // ============================================
  LEAVE_CREATE: 'hms:leave:create:own',
  LEAVE_READ: 'hms:leave:read:hostel',
  LEAVE_APPROVE: 'hms:leave:approve:hostel',
  LEAVE_DELETE: 'hms:leave:delete:hostel',
  
  // ============================================
  // Gate Pass Management
  // ============================================
  GATEPASS_CREATE: 'hms:gatepass:create:hostel',
  GATEPASS_READ: 'hms:gatepass:read:hostel',
  GATEPASS_SCAN: 'hms:gatepass:scan:gate',
  
  // ============================================
  // Complaint Management
  // ============================================
  COMPLAINT_CREATE: 'hms:complaint:create:own',
  COMPLAINT_READ: 'hms:complaint:read:hostel',
  COMPLAINT_UPDATE: 'hms:complaint:update:hostel',
  COMPLAINT_APPROVE: 'hms:complaint:approve:hostel',
  COMPLAINT_DELETE: 'hms:complaint:delete:hostel',
  
  // ============================================
  // Reports & Analytics
  // ============================================
  REPORT_READ: 'hms:report:read:org',
  REPORT_EXPORT: 'hms:report:export:org',
  
  // ============================================
  // Audit & System
  // ============================================
  AUDIT_READ: 'hms:audit:read:org',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============================================
// Permission Groups
// ============================================
export const PERMISSION_GROUPS = {
  HIERARCHY: [
    PERMISSIONS.HOSTEL_CREATE,
    PERMISSIONS.HOSTEL_READ,
    PERMISSIONS.HOSTEL_UPDATE,
    PERMISSIONS.HOSTEL_DELETE,
    PERMISSIONS.BUILDING_CREATE,
    PERMISSIONS.BUILDING_READ,
    PERMISSIONS.BUILDING_UPDATE,
    PERMISSIONS.BUILDING_DELETE,
    PERMISSIONS.WING_CREATE,
    PERMISSIONS.WING_READ,
    PERMISSIONS.WING_UPDATE,
    PERMISSIONS.WING_DELETE,
    PERMISSIONS.FLOOR_CREATE,
    PERMISSIONS.FLOOR_READ,
    PERMISSIONS.FLOOR_UPDATE,
    PERMISSIONS.FLOOR_DELETE,
    PERMISSIONS.ROOM_CREATE,
    PERMISSIONS.ROOM_READ,
    PERMISSIONS.ROOM_UPDATE,
    PERMISSIONS.ROOM_DELETE,
    PERMISSIONS.BED_CREATE,
    PERMISSIONS.BED_READ,
    PERMISSIONS.BED_UPDATE,
    PERMISSIONS.BED_DELETE,
  ],
  ALLOCATION: [
    PERMISSIONS.ALLOCATION_CREATE,
    PERMISSIONS.ALLOCATION_READ,
    PERMISSIONS.ALLOCATION_UPDATE,
    PERMISSIONS.ALLOCATION_DELETE,
    PERMISSIONS.ALLOCATION_APPROVE,
  ],
  TRANSFER: [
    PERMISSIONS.TRANSFER_CREATE,
    PERMISSIONS.TRANSFER_READ,
    PERMISSIONS.TRANSFER_APPROVE,
  ],
  ATTENDANCE: [
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ATTENDANCE_DELETE,
  ],
  LEAVE: [
    PERMISSIONS.LEAVE_CREATE,
    PERMISSIONS.LEAVE_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_DELETE,
  ],
  GATEPASS: [
    PERMISSIONS.GATEPASS_CREATE,
    PERMISSIONS.GATEPASS_READ,
    PERMISSIONS.GATEPASS_SCAN,
  ],
  COMPLAINTS: [
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.COMPLAINT_READ,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_APPROVE,
    PERMISSIONS.COMPLAINT_DELETE,
  ],
  REPORTS: [
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],
  AUDIT: [
    PERMISSIONS.AUDIT_READ,
  ],
} as const;

// ============================================
// Permission Helpers
// ============================================
export function hasPermission(permissions: string[], required: Permission): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(permissions: string[], required: Permission[]): boolean {
  return required.some(p => permissions.includes(p));
}

export function hasAllPermissions(permissions: string[], required: Permission[]): boolean {
  return required.every(p => permissions.includes(p));
}

export function getPermissionResource(permission: string): string {
  return permission.split(':')[1] || '';
}

export function getPermissionAction(permission: string): string {
  return permission.split(':')[2] || '';
}

export function getPermissionScope(permission: string): string {
  return permission.split(':')[3] || '';
}

export function isValidPermission(permission: string): boolean {
  const pattern = /^hms:[a-z_]+:[a-z_]+:[a-z_]+$/;
  return pattern.test(permission);
}

// ============================================
// Permission Descriptions
// ============================================
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.HOSTEL_CREATE]: 'Create new hostels',
  [PERMISSIONS.HOSTEL_READ]: 'View hostel information',
  [PERMISSIONS.HOSTEL_UPDATE]: 'Update hostel information',
  [PERMISSIONS.HOSTEL_DELETE]: 'Delete hostels',
  
  [PERMISSIONS.BUILDING_CREATE]: 'Create new buildings',
  [PERMISSIONS.BUILDING_READ]: 'View building information',
  [PERMISSIONS.BUILDING_UPDATE]: 'Update building information',
  [PERMISSIONS.BUILDING_DELETE]: 'Delete buildings',
  
  [PERMISSIONS.WING_CREATE]: 'Create new wings',
  [PERMISSIONS.WING_READ]: 'View wing information',
  [PERMISSIONS.WING_UPDATE]: 'Update wing information',
  [PERMISSIONS.WING_DELETE]: 'Delete wings',
  
  [PERMISSIONS.FLOOR_CREATE]: 'Create new floors',
  [PERMISSIONS.FLOOR_READ]: 'View floor information',
  [PERMISSIONS.FLOOR_UPDATE]: 'Update floor information',
  [PERMISSIONS.FLOOR_DELETE]: 'Delete floors',
  
  [PERMISSIONS.ROOM_CREATE]: 'Create new rooms',
  [PERMISSIONS.ROOM_READ]: 'View room information',
  [PERMISSIONS.ROOM_UPDATE]: 'Update room information',
  [PERMISSIONS.ROOM_DELETE]: 'Delete rooms',
  
  [PERMISSIONS.BED_CREATE]: 'Create new beds',
  [PERMISSIONS.BED_READ]: 'View bed information',
  [PERMISSIONS.BED_UPDATE]: 'Update bed information',
  [PERMISSIONS.BED_DELETE]: 'Delete beds',
  
  [PERMISSIONS.ALLOCATION_CREATE]: 'Create bed allocations',
  [PERMISSIONS.ALLOCATION_READ]: 'View allocations',
  [PERMISSIONS.ALLOCATION_UPDATE]: 'Update allocations',
  [PERMISSIONS.ALLOCATION_DELETE]: 'Delete allocations',
  [PERMISSIONS.ALLOCATION_APPROVE]: 'Approve allocations',
  
  [PERMISSIONS.TRANSFER_CREATE]: 'Request bed transfers',
  [PERMISSIONS.TRANSFER_READ]: 'View transfer requests',
  [PERMISSIONS.TRANSFER_APPROVE]: 'Approve transfer requests',
  
  [PERMISSIONS.ATTENDANCE_CREATE]: 'Mark attendance',
  [PERMISSIONS.ATTENDANCE_READ]: 'View attendance',
  [PERMISSIONS.ATTENDANCE_UPDATE]: 'Update attendance',
  [PERMISSIONS.ATTENDANCE_DELETE]: 'Delete attendance',
  
  [PERMISSIONS.LEAVE_CREATE]: 'Request leave',
  [PERMISSIONS.LEAVE_READ]: 'View leave requests',
  [PERMISSIONS.LEAVE_APPROVE]: 'Approve leave requests',
  [PERMISSIONS.LEAVE_DELETE]: 'Delete leave requests',
  
  [PERMISSIONS.GATEPASS_CREATE]: 'Create gate passes',
  [PERMISSIONS.GATEPASS_READ]: 'View gate passes',
  [PERMISSIONS.GATEPASS_SCAN]: 'Scan gate passes',
  
  [PERMISSIONS.COMPLAINT_CREATE]: 'Raise complaints',
  [PERMISSIONS.COMPLAINT_READ]: 'View complaints',
  [PERMISSIONS.COMPLAINT_UPDATE]: 'Update complaints',
  [PERMISSIONS.COMPLAINT_APPROVE]: 'Approve complaint resolution',
  [PERMISSIONS.COMPLAINT_DELETE]: 'Delete complaints',
  
  [PERMISSIONS.REPORT_READ]: 'View reports',
  [PERMISSIONS.REPORT_EXPORT]: 'Export reports',
  
  [PERMISSIONS.AUDIT_READ]: 'View audit logs',
};