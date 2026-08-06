export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half-day',
  ON_LEAVE: 'on-leave',
  HOLIDAY: 'holiday'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const LEAVE_TYPE = {
  CASUAL: 'casual',
  SICK: 'sick',
  EMERGENCY: 'emergency',
  PAID: 'paid',
  HALF_DAY: 'half-day',
  WORK_FROM_HOME: 'work-from-home'
};

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

export const MEETING_TYPE = {
  PHYSICAL: 'physical',
  VIRTUAL: 'virtual',
  HYBRID: 'hybrid'
};

export const MEETING_PLATFORM = {
  GOOGLE_MEET: 'google-meet',
  ZOOM: 'zoom',
  TEAMS: 'teams',
  OTHER: 'other'
};

export const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ANNOUNCEMENT_TYPE = {
  COMPANY: 'company',
  HR: 'hr',
  HOLIDAY: 'holiday',
  BIRTHDAY: 'birthday',
  ACHIEVEMENT: 'achievement',
  EMERGENCY: 'emergency',
  POLICY: 'policy'
};

export const DOCUMENT_TYPE = {
  COMPANY_POLICY: 'company-policy',
  HR_POLICY: 'hr-policy',
  LEAVE_POLICY: 'leave-policy',
  CODE_OF_CONDUCT: 'code-of-conduct',
  NDA: 'nda',
  OFFER_LETTER: 'offer-letter',
  SALARY_SLIP: 'salary-slip',
  APPOINTMENT_LETTER: 'appointment-letter',
  OTHER: 'other'
};

export const DOCUMENT_CATEGORY = {
  POLICY: 'policy',
  HR: 'hr',
  LEGAL: 'legal',
  EMPLOYEE: 'employee',
  FINANCIAL: 'financial'
};

export const REPORT_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  TASK_COMPLETION: 'task-completion',
  PERFORMANCE: 'performance',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave'
};

export const CHAT_TYPE = {
  PRIVATE: 'private',
  GROUP: 'group',
  DEPARTMENT: 'department',
  BROADCAST: 'broadcast'
};

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task-assigned',
  TASK_DEADLINE: 'task-deadline',
  MEETING_REMINDER: 'meeting-reminder',
  LEAVE_APPROVED: 'leave-approved',
  ATTENDANCE_REMINDER: 'attendance-reminder',
  ANNOUNCEMENT: 'announcement',
  BIRTHDAY: 'birthday',
  COMPANY_NOTICE: 'company-notice',
  MESSAGE: 'message'
};

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERN: 'intern'
};

export const DEFAULT_WORKING_HOURS = 8;
export const START_TIME = '09:00';
export const END_TIME = '18:00';
export const LUNCH_BREAK_DURATION = 60;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGIN_ACTIVITY: '/auth/login-activity',
    VALIDATE_TOKEN: '/auth/validate-token'
  },
  EMPLOYEES: {
    BASE: '/employees',
    SUSPEND: '/employees/:id/suspend',
    RESET_PASSWORD: '/employees/:id/reset-password',
    ASSIGN_ROLE: '/employees/:id/assign-role'
  },
  ATTENDANCE: {
    BASE: '/attendance',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    LUNCH_START: '/attendance/lunch/start',
    LUNCH_END: '/attendance/lunch/end',
    HISTORY: '/attendance/history',
    STATS: '/attendance/stats',
    ALL: '/attendance/all',
    CORRECT: '/attendance/:id/correct',
    DEPARTMENT: '/attendance/department/:departmentId'
  },
  TASKS: {
    BASE: '/tasks',
    MY_TASKS: '/tasks/my-tasks',
    COMMENTS: '/tasks/:id/comments',
    UPLOAD_WORK: '/tasks/:id/upload-work'
  },
  LEAVE: {
    BASE: '/leave',
    APPLY: '/leave/apply',
    MY_LEAVES: '/leave/my-leaves',
    BALANCE: '/leave/balance',
    ALL: '/leave/all',
    APPROVE: '/leave/:id/approve'
  },
  MEETINGS: {
    BASE: '/meetings',
    MY_MEETINGS: '/meetings/my-meetings',
    NOTES: '/meetings/:id/notes'
  },
  ANNOUNCEMENTS: {
    BASE: '/announcements',
    HOLIDAYS: '/announcements/holidays',
    COMMENTS: '/announcements/:id/comments'
  },
  DOCUMENTS: {
    BASE: '/documents',
    POLICIES: '/documents/policies',
    EMPLOYEE: '/documents/employee/:employeeId'
  },
  REPORTS: {
    BASE: '/reports',
    GENERATE: '/reports/generate',
    DAILY: '/reports/daily'
  },
  CHAT: {
    BASE: '/chat',
    UNREAD: '/chat/unread',
    MESSAGES: '/chat/:id/messages',
    READ: '/chat/:id/read'
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all'
  },
  DEPARTMENTS: {
    BASE: '/departments',
    EMPLOYEES: '/departments/:id/employees'
  },
  ANALYTICS: {
    ADMIN: '/analytics/admin',
    EMPLOYEE: '/analytics/employee',
    TEAM: '/analytics/team'
  },
  PROFILE: {
    BASE: '/profile',
    PHOTO: '/profile/photo',
    CHANGE_PASSWORD: '/profile/change-password',
    DOCUMENTS: '/profile/documents'
  }
};