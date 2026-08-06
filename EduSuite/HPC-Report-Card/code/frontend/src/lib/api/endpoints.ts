// This map mirrors backend/routes/hpc.routes.js exactly (mounted at /api in app.js).
// Every path here corresponds 1:1 to a router.<verb>(...) registration in that file.
export const API_ENDPOINTS = {
  // Competencies
  COMPETENCIES: '/competencies',
  COMPETENCY: (id: number | string) => `/competencies/${id}`,

  // Student entries (scoped to an academic cycle)
  STUDENT_ENTRIES: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/entries`,
  ENTRIES: '/entries',
  ENTRY: (entryId: number | string) => `/entries/${entryId}`,
  WORKFLOW: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/workflow`,

  // Reports
  DOMAIN_SUMMARY: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/domain-summary`,
  PROGRESS: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/progress`,
  PREVIEW: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/preview`,

  // Dashboard
  DASHBOARD: '/dashboard',
  DASHBOARD_STATISTICS: '/dashboard/statistics',
  DASHBOARD_ACTIVITY: '/dashboard/activity',

  // Finalized report cards
  CARD: (cardId: number | string) => `/cards/${cardId}`,
  CARD_BY_STUDENT: (studentId: number | string, cycleId: number | string) =>
    `/students/${studentId}/cycles/${cycleId}/card`,
  CARD_PDF: (cardId: number | string) => `/cards/${cardId}/pdf`,
  CARDS_RECENT: '/cards/recent',
  FINALIZE: '/finalize',
} as const;
