export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const RECRUITMENT_STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewed',
  'Selected',
  'Offered',
  'Hired',
  'Rejected',
] as const;

export const VACANCY_STATUSES = [
  'Draft',
  'Open',
  'On Hold',
  'Closed',
  'Cancelled',
] as const;

export const EMPLOYMENT_TYPES = [
  'Full Time',
  'Part Time',
  'Contract',
  'Internship',
  'Temporary',
] as const;

export const WORK_MODES = [
  'On Site',
  'Remote',
  'Hybrid',
] as const;

export const INTERVIEW_TYPES = [
  'HR',
  'Technical',
  'Managerial',
  'Final',
] as const;

export const INTERVIEW_MODES = [
  'Offline',
  'Online',
  'Telephonic',
] as const;

export const OFFER_STATUSES = [
  'Draft',
  'Pending',
  'Sent',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Expired',
] as const;

export const APPLICATION_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Walk In',
  'Job Portal',
  'Campus',
  'Agency',
  'Other',
] as const;

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
] as const;

export const STAGE_COLORS: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-800',
  Screening: 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-purple-100 text-purple-800',
  'Interview Scheduled': 'bg-indigo-100 text-indigo-800',
  Interviewed: 'bg-pink-100 text-pink-800',
  Selected: 'bg-green-100 text-green-800',
  Offered: 'bg-gold/20 text-gold',
  Hired: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
};

export const STAGE_ORDER: Record<string, number> = {
  Applied: 0,
  Screening: 1,
  Shortlisted: 2,
  'Interview Scheduled': 3,
  Interviewed: 4,
  Selected: 5,
  Offered: 6,
  Hired: 7,
  Rejected: 8,
};

export const VACANCY_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Open: 'bg-green-100 text-green-800',
  'On Hold': 'bg-yellow-100 text-yellow-800',
  Closed: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Rescheduled: 'bg-yellow-100 text-yellow-800',
  'No Show': 'bg-gray-100 text-gray-500',
};

export const OFFER_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Withdrawn: 'bg-gray-100 text-gray-500',
  Expired: 'bg-gray-100 text-gray-500',
};