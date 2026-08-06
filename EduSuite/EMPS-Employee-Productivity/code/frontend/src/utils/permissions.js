export const PERMISSIONS = {
  // Admin permissions
  ADMIN: {
    ALL: '*',
    VIEW_EMPLOYEES: 'view_employees',
    MANAGE_EMPLOYEES: 'manage_employees',
    VIEW_DEPARTMENTS: 'view_departments',
    MANAGE_DEPARTMENTS: 'manage_departments',
    VIEW_ATTENDANCE: 'view_attendance',
    MANAGE_ATTENDANCE: 'manage_attendance',
    VIEW_LEAVE: 'view_leave',
    MANAGE_LEAVE: 'manage_leave',
    VIEW_TASKS: 'view_tasks',
    MANAGE_TASKS: 'manage_tasks',
    VIEW_MEETINGS: 'view_meetings',
    MANAGE_MEETINGS: 'manage_meetings',
    VIEW_REPORTS: 'view_reports',
    GENERATE_REPORTS: 'generate_reports',
    VIEW_DOCUMENTS: 'view_documents',
    MANAGE_DOCUMENTS: 'manage_documents',
    VIEW_ANNOUNCEMENTS: 'view_announcements',
    MANAGE_ANNOUNCEMENTS: 'manage_announcements',
    VIEW_SETTINGS: 'view_settings',
    MANAGE_SETTINGS: 'manage_settings',
  },
  // HR permissions
  HR: {
    VIEW_EMPLOYEES: 'view_employees',
    MANAGE_EMPLOYEES: 'manage_employees',
    VIEW_DEPARTMENTS: 'view_departments',
    VIEW_ATTENDANCE: 'view_attendance',
    MANAGE_ATTENDANCE: 'manage_attendance',
    VIEW_LEAVE: 'view_leave',
    MANAGE_LEAVE: 'manage_leave',
    VIEW_TASKS: 'view_tasks',
    VIEW_MEETINGS: 'view_meetings',
    VIEW_REPORTS: 'view_reports',
    GENERATE_REPORTS: 'generate_reports',
    VIEW_DOCUMENTS: 'view_documents',
    MANAGE_DOCUMENTS: 'manage_documents',
    VIEW_ANNOUNCEMENTS: 'view_announcements',
    MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  },
  // Manager permissions
  MANAGER: {
    VIEW_TEAM: 'view_team',
    MANAGE_TEAM_TASKS: 'manage_team_tasks',
    VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
    APPROVE_LEAVE: 'approve_leave',
    VIEW_TEAM_REPORTS: 'view_team_reports',
    SCHEDULE_MEETINGS: 'schedule_meetings',
    VIEW_ANNOUNCEMENTS: 'view_announcements',
  },
  // Employee permissions
  EMPLOYEE: {
    VIEW_SELF: 'view_self',
    MANAGE_SELF_TASKS: 'manage_self_tasks',
    APPLY_LEAVE: 'apply_leave',
    VIEW_ANNOUNCEMENTS: 'view_announcements',
    VIEW_DOCUMENTS: 'view_documents',
    VIEW_ATTENDANCE: 'view_attendance',
  }
};

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS.ADMIN),
  hr: Object.values(PERMISSIONS.HR),
  manager: Object.values(PERMISSIONS.MANAGER),
  employee: Object.values(PERMISSIONS.EMPLOYEE),
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.some(p => hasPermission(user, p));
};

export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return permissions.every(p => hasPermission(user, p));
};

export const getVisibleRoutes = (user) => {
  const routes = {
    admin: [
      '/dashboard',
      '/attendance',
      '/tasks',
      '/leave',
      '/meetings',
      '/communication',
      '/announcements',
      '/documents',
      '/reports',
      '/admin',
      '/profile',
      '/settings'
    ],
    hr: [
      '/dashboard',
      '/attendance',
      '/tasks',
      '/leave',
      '/meetings',
      '/communication',
      '/announcements',
      '/documents',
      '/reports',
      '/profile',
      '/settings'
    ],
    manager: [
      '/dashboard',
      '/attendance',
      '/tasks',
      '/leave',
      '/meetings',
      '/communication',
      '/announcements',
      '/documents',
      '/reports',
      '/team',
      '/profile',
      '/settings'
    ],
    employee: [
      '/dashboard',
      '/attendance',
      '/tasks',
      '/leave',
      '/meetings',
      '/communication',
      '/announcements',
      '/documents',
      '/reports',
      '/profile',
      '/settings'
    ]
  };

  return routes[user?.role] || routes.employee;
};