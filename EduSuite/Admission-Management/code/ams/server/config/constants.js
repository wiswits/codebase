// Central place for enums referenced across the codebase (PRD section 6).

const ROLES = {
  ADMIN: 'admin',
  ADMISSION_OFFICER: 'admission_officer',
  COUNSELOR: 'counselor',
  PANELIST: 'panelist',
};

const ENQUIRY_STAGES = [
  'New',
  'Contacted',
  'Follow-up',
  'Interested',
  'Application Started',
  'Converted',
  'Lost',
]; // FR5

const SOURCES = ['Walk-in', 'Website', 'Referral', 'Facebook Ads', 'Agent', 'Other']; // FR8

const APPLICATION_STATUSES = [
  'Draft',
  'Submitted',
  'Documents Pending',
  'Documents Verified',
  'Test Scheduled',
  'Test Qualified',
  'Below Cutoff',
  'Interview Scheduled',
  'Interviewed',
  'Offer Sent',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Admitted',
  'Waitlisted',
];

const QUOTA_CATEGORIES = ['General', 'RTE', 'EWS', 'Sibling', 'Staff', 'Sports', 'Management']; // FR25

const DOCUMENT_STATUSES = ['Pending', 'Verified', 'Rejected'];

const DOC_CHECKLIST_DEFAULT = [
  'Birth Certificate',
  'Aadhaar Card',
  'Transfer Certificate',
  'Marksheet (Last Exam)',
  'Passport Photo',
];

module.exports = {
  ROLES,
  ENQUIRY_STAGES,
  SOURCES,
  APPLICATION_STATUSES,
  QUOTA_CATEGORIES,
  DOCUMENT_STATUSES,
  DOC_CHECKLIST_DEFAULT,
};
