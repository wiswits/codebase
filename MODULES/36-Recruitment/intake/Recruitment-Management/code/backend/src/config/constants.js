/**
 * Recruitment Module Constants
 * All enums and status values centralized here
 */

export const VACANCY_STATUS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  ON_HOLD: 'On Hold',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

export const WORK_MODE = {
  ON_SITE: 'On Site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export const APPLICANT_STAGES = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWED: 'Interviewed',
  SELECTED: 'Selected',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

export const APPLICANT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

export const APPLICATION_SOURCE = {
  WEBSITE: 'Website',
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Referral',
  WALK_IN: 'Walk In',
  JOB_PORTAL: 'Job Portal',
  CAMPUS: 'Campus',
  AGENCY: 'Agency',
  OTHER: 'Other',
};

export const INTERVIEW_TYPE = {
  HR: 'HR',
  TECHNICAL: 'Technical',
  MANAGERIAL: 'Managerial',
  FINAL: 'Final',
};

export const INTERVIEW_MODE = {
  OFFLINE: 'Offline',
  ONLINE: 'Online',
  TELEPHONIC: 'Telephonic',
};

export const INTERVIEW_STATUS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
  NO_SHOW: 'No Show',
};

export const RECOMMENDATION = {
  STRONG_HIRE: 'Strong Hire',
  HIRE: 'Hire',
  HOLD: 'Hold',
  REJECT: 'Reject',
};

export const OFFER_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
};

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const PERMISSIONS = {
  VIEW: 'recruitment:view',
  CREATE: 'recruitment:create',
  UPDATE: 'recruitment:update',
  DELETE: 'recruitment:delete',
  APPROVE: 'recruitment:approve',
  INTERVIEW: 'recruitment:interview',
  OFFER: 'recruitment:offer',
  REPORTS: 'recruitment:reports',
};

// Validation constants
export const VALIDATION = {
  MAX_EMAIL_LENGTH: 150,
  MAX_PHONE_LENGTH: 20,
  MAX_NAME_LENGTH: 100,
  MAX_JOB_TITLE_LENGTH: 150,
  MAX_DEPARTMENT_LENGTH: 100,
  MAX_VACANCY_CODE_LENGTH: 30,
  MAX_APPLICANT_CODE_LENGTH: 30,
  MAX_OFFER_REFERENCE_LENGTH: 50,
};