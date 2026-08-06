// Permission constants - single source of truth
export const PERMISSIONS = {
  // Hierarchy
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
  
  // Allocation
  ALLOCATION_CREATE: 'hms:allocation:create:hostel',
  ALLOCATION_READ: 'hms:allocation:read:hostel',
  ALLOCATION_UPDATE: 'hms:allocation:update:hostel',
  ALLOCATION_DELETE: 'hms:allocation:delete:hostel',
  ALLOCATION_APPROVE: 'hms:allocation:approve:hostel',
  
  // Transfer
  TRANSFER_CREATE: 'hms:transfer:create:own',
  TRANSFER_READ: 'hms:transfer:read:hostel',
  TRANSFER_APPROVE: 'hms:transfer:approve:hostel',
  
  // Attendance
  ATTENDANCE_CREATE: 'hms:attendance:create:hostel',
  ATTENDANCE_READ: 'hms:attendance:read:hostel',
  ATTENDANCE_UPDATE: 'hms:attendance:update:hostel',
  ATTENDANCE_DELETE: 'hms:attendance:delete:hostel',
  
  // Leave
  LEAVE_CREATE: 'hms:leave:create:own',
  LEAVE_READ: 'hms:leave:read:hostel',
  LEAVE_APPROVE: 'hms:leave:approve:hostel',
  LEAVE_DELETE: 'hms:leave:delete:hostel',
  
  // Gate Pass
  GATEPASS_CREATE: 'hms:gatepass:create:hostel',
  GATEPASS_READ: 'hms:gatepass:read:hostel',
  GATEPASS_SCAN: 'hms:gatepass:scan:gate',
  
  // Complaints
  COMPLAINT_CREATE: 'hms:complaint:create:own',
  COMPLAINT_READ: 'hms:complaint:read:hostel',
  COMPLAINT_UPDATE: 'hms:complaint:update:hostel',
  COMPLAINT_APPROVE: 'hms:complaint:approve:hostel',
  COMPLAINT_DELETE: 'hms:complaint:delete:hostel',
  
  // Reports
  REPORT_READ: 'hms:report:read:org',
  REPORT_EXPORT: 'hms:report:export:org',
  
  // Audit
  AUDIT_READ: 'hms:audit:read:org',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission groups for easier management
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
} as const;

// Helper functions
export function hasPermission(permissions: string[], required: Permission): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(permissions: string[], required: Permission[]): boolean {
  return required.some(p => permissions.includes(p));
}

export function hasAllPermissions(permissions: string[], required: Permission[]): boolean {
  return required.every(p => permissions.includes(p));
}

// Validate permission string format
export function isValidPermission(permission: string): boolean {
  const pattern = /^hms:[a-z_]+:[a-z_]+:[a-z_]+$/;
  return pattern.test(permission);
}