/**
 * HMS Role Constants
 * Single source of truth for all roles
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  CAMPUS_ADMIN: 'campus_admin',
  HOSTEL_ADMIN: 'hostel_admin',
  WARDEN: 'warden',
  ASST_WARDEN: 'asst_warden',
  SECURITY_GUARD: 'security_guard',
  ACCOUNTANT: 'accountant',
  MAINTENANCE: 'maintenance',
  STUDENT: 'student',
  PARENT: 'parent',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================
// Role Metadata
// ============================================
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.ORG_ADMIN]: 'Organization Administrator',
  [ROLES.CAMPUS_ADMIN]: 'Campus Administrator',
  [ROLES.HOSTEL_ADMIN]: 'Hostel Administrator',
  [ROLES.WARDEN]: 'Warden',
  [ROLES.ASST_WARDEN]: 'Assistant Warden',
  [ROLES.SECURITY_GUARD]: 'Security Guard',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.MAINTENANCE]: 'Maintenance Staff',
  [ROLES.STUDENT]: 'Student',
  [ROLES.PARENT]: 'Parent',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Full system access across all organizations. Can manage everything.',
  [ROLES.ORG_ADMIN]: 'Manage everything within the organization including all hostels and campuses.',
  [ROLES.CAMPUS_ADMIN]: 'Manage campuses within the organization. Cannot access other campuses.',
  [ROLES.HOSTEL_ADMIN]: 'Manage a specific hostel including all operations and staff.',
  [ROLES.WARDEN]: 'Manage hostel operations, student welfare, and daily activities.',
  [ROLES.ASST_WARDEN]: 'Assist warden with daily operations and student management.',
  [ROLES.SECURITY_GUARD]: 'Scan gate passes and manage student entry/exit.',
  [ROLES.ACCOUNTANT]: 'Manage financial reports, fee clearance, and revenue tracking.',
  [ROLES.MAINTENANCE]: 'Handle maintenance complaints and facility management.',
  [ROLES.STUDENT]: 'Access personal hostel information, request leave, raise complaints.',
  [ROLES.PARENT]: 'Access child\'s hostel information, approve leave requests.',
};

// ============================================
// Role Hierarchy (higher number = more privileges)
// ============================================
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ORG_ADMIN]: 80,
  [ROLES.CAMPUS_ADMIN]: 60,
  [ROLES.HOSTEL_ADMIN]: 50,
  [ROLES.WARDEN]: 40,
  [ROLES.ASST_WARDEN]: 30,
  [ROLES.SECURITY_GUARD]: 20,
  [ROLES.ACCOUNTANT]: 20,
  [ROLES.MAINTENANCE]: 15,
  [ROLES.STUDENT]: 10,
  [ROLES.PARENT]: 10,
};

// ============================================
// Role Colors
// ============================================
export const ROLE_COLORS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: '#FF6B6B',
  [ROLES.ORG_ADMIN]: '#4ECDC4',
  [ROLES.CAMPUS_ADMIN]: '#45B7D1',
  [ROLES.HOSTEL_ADMIN]: '#96CEB4',
  [ROLES.WARDEN]: '#FFEAA7',
  [ROLES.ASST_WARDEN]: '#DDA0DD',
  [ROLES.SECURITY_GUARD]: '#98D8C8',
  [ROLES.ACCOUNTANT]: '#F7DC6F',
  [ROLES.MAINTENANCE]: '#BB8FCE',
  [ROLES.STUDENT]: '#85C1E9',
  [ROLES.PARENT]: '#F1948A',
};

// ============================================
// Role Icons
// ============================================
export const ROLE_ICONS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: '👑',
  [ROLES.ORG_ADMIN]: '🏢',
  [ROLES.CAMPUS_ADMIN]: '🏫',
  [ROLES.HOSTEL_ADMIN]: '🏨',
  [ROLES.WARDEN]: '👨‍🏫',
  [ROLES.ASST_WARDEN]: '👨‍🎓',
  [ROLES.SECURITY_GUARD]: '👮',
  [ROLES.ACCOUNTANT]: '💰',
  [ROLES.MAINTENANCE]: '🔧',
  [ROLES.STUDENT]: '🧑‍🎓',
  [ROLES.PARENT]: '👨‍👩‍👦',
};

// ============================================
// Role Helpers
// ============================================
export function isHigherRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

export function isLowerRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] < ROLE_HIERARCHY[role2];
}

export function isEqualRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] === ROLE_HIERARCHY[role2];
}

export function canManageRole(manager: Role, target: Role): boolean {
  return ROLE_HIERARCHY[manager] > ROLE_HIERARCHY[target];
}

export function getRolesAbove(role: Role): Role[] {
  return Object.keys(ROLE_HIERARCHY)
    .filter((r) => ROLE_HIERARCHY[r as Role] > ROLE_HIERARCHY[role])
    .map((r) => r as Role);
}

export function getRolesBelow(role: Role): Role[] {
  return Object.keys(ROLE_HIERARCHY)
    .filter((r) => ROLE_HIERARCHY[r as Role] < ROLE_HIERARCHY[role])
    .map((r) => r as Role);
}

// ============================================
// Role Groups
// ============================================
export const ROLE_GROUPS = {
  ADMIN: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HOSTEL_ADMIN],
  WARDEN_STAFF: [ROLES.WARDEN, ROLES.ASST_WARDEN],
  OPERATIONAL: [ROLES.SECURITY_GUARD, ROLES.ACCOUNTANT, ROLES.MAINTENANCE],
  USERS: [ROLES.STUDENT, ROLES.PARENT],
} as const;