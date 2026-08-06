export const ROLES = {
  ADMIN: 'admin',
  EXAM_CONTROLLER: 'exam_controller',
  TEACHER: 'teacher',
  STUDENT: 'student',
  INVIGILATOR: 'invigilator',
  PRINCIPAL: 'principal',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  exam_controller: 'Exam Controller',
  teacher: 'Teacher',
  student: 'Student',
  invigilator: 'Invigilator',
  principal: 'Principal',
};

const ADMIN_ROLES = ['admin', 'exam_controller', 'teacher', 'invigilator', 'principal'];

export const SIDEBAR_LINKS = [
  { label: 'Dashboard', to: '/', icon: 'LayoutDashboard', roles: ADMIN_ROLES },
  { label: 'Exam Scheduler', to: '/exam-scheduler', icon: 'CalendarDays', roles: ADMIN_ROLES },
  { label: 'Blueprint Builder', to: '/blueprint-builder', icon: 'FileStack', roles: ['admin', 'exam_controller', 'teacher'] },
  { label: 'Question Bank', to: '/question-bank', icon: 'BookOpenCheck', roles: ['admin', 'exam_controller', 'teacher'] },
  { label: 'Paper Generation', to: '/paper-generation', icon: 'FileCog', roles: ['admin', 'exam_controller', 'teacher'] },
  { label: 'Seating Plan', to: '/seating-plan', icon: 'Grid3x3', roles: ['admin', 'exam_controller', 'invigilator'] },
  { label: 'Invigilation', to: '/invigilation', icon: 'ShieldCheck', roles: ['admin', 'exam_controller', 'principal'] },
  { label: 'Hall Tickets', to: '/hall-tickets', icon: 'CreditCard', roles: ['admin', 'exam_controller'] },
  { label: 'OMR Evaluation', to: '/omr-evaluation', icon: 'ScanLine', roles: ['admin', 'exam_controller', 'teacher'] },
  { label: 'Result Entry', to: '/result-entry', icon: 'Edit3', roles: ['admin', 'exam_controller', 'teacher'] },
  { label: 'Moderation', to: '/moderation', icon: 'GitPullRequestArrow', roles: ['admin', 'exam_controller', 'principal'] },
  { label: 'Result Processing', to: '/result-processing', icon: 'Calculator', roles: ['admin', 'exam_controller'] },
  { label: 'Result Publishing', to: '/result-publishing', icon: 'Send', roles: ['admin', 'exam_controller', 'principal'] },
  { label: 'Reports & Analytics', to: '/reports-analytics', icon: 'BarChart3', roles: ADMIN_ROLES },
  { label: 'Settings', to: '/settings', icon: 'Settings', roles: ['admin'] },
];

export const STUDENT_SIDEBAR_LINKS = [
  { label: 'My Results', to: '/my-results', icon: 'GraduationCap', roles: ['student'] },
  { label: 'My Seating Plan', to: '/my-seating-plan', icon: 'Grid3x3', roles: ['student'] },
  { label: 'Practice Questions', to: '/practice-questions', icon: 'BookOpenCheck', roles: ['student'] },
];
