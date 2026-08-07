module.exports = {
  ROLES: {
    ADMIN: 'admin',
    HR: 'hr',
    MANAGER: 'manager',
    EMPLOYEE: 'employee'
  },
  
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half-day',
    ON_LEAVE: 'on-leave',
    HOLIDAY: 'holiday'
  },
  
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  LEAVE_TYPE: {
    CASUAL: 'casual',
    SICK: 'sick',
    EMERGENCY: 'emergency',
    PAID: 'paid',
    HALF_DAY: 'half-day',
    WORK_FROM_HOME: 'work-from-home'
  },
  
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },
  
  MEETING_TYPE: {
    PHYSICAL: 'physical',
    VIRTUAL: 'virtual',
    HYBRID: 'hybrid'
  },
  
  MEETING_PLATFORM: {
    GOOGLE_MEET: 'google-meet',
    ZOOM: 'zoom',
    TEAMS: 'teams',
    OTHER: 'other'
  },
  
  MEETING_STATUS: {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  ANNOUNCEMENT_TYPE: {
    COMPANY: 'company',
    HR: 'hr',
    HOLIDAY: 'holiday',
    BIRTHDAY: 'birthday',
    ACHIEVEMENT: 'achievement',
    EMERGENCY: 'emergency',
    POLICY: 'policy'
  },
  
  DOCUMENT_TYPE: {
    COMPANY_POLICY: 'company-policy',
    HR_POLICY: 'hr-policy',
    LEAVE_POLICY: 'leave-policy',
    CODE_OF_CONDUCT: 'code-of-conduct',
    NDA: 'nda',
    OFFER_LETTER: 'offer-letter',
    SALARY_SLIP: 'salary-slip',
    APPOINTMENT_LETTER: 'appointment-letter',
    OTHER: 'other'
  },
  
  DOCUMENT_CATEGORY: {
    POLICY: 'policy',
    HR: 'hr',
    LEGAL: 'legal',
    EMPLOYEE: 'employee',
    FINANCIAL: 'financial'
  },
  
  REPORT_TYPE: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    TASK_COMPLETION: 'task-completion',
    PERFORMANCE: 'performance',
    ATTENDANCE: 'attendance',
    LEAVE: 'leave'
  },
  
  CHAT_TYPE: {
    PRIVATE: 'private',
    GROUP: 'group',
    DEPARTMENT: 'department',
    BROADCAST: 'broadcast'
  },
  
  NOTIFICATION_TYPE: {
    TASK_ASSIGNED: 'task-assigned',
    TASK_DEADLINE: 'task-deadline',
    MEETING_REMINDER: 'meeting-reminder',
    LEAVE_APPROVED: 'leave-approved',
    ATTENDANCE_REMINDER: 'attendance-reminder',
    ANNOUNCEMENT: 'announcement',
    BIRTHDAY: 'birthday',
    COMPANY_NOTICE: 'company-notice',
    MESSAGE: 'message'
  },
  
  EMPLOYMENT_TYPE: {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    CONTRACT: 'contract',
    INTERN: 'intern'
  },
  
  DEFAULT_WORKING_HOURS: 8,
  START_TIME: '09:00',
  END_TIME: '18:00',
  LUNCH_BREAK_DURATION: 60,
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
};