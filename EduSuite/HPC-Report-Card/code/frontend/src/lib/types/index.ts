// ============================================================
// API envelope
// Matches backend/utils/apiResponse.js -> successResponse()
// { success, message, data, timestamp }
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors: string[] | null;
  timestamp: string;
}

// ============================================================
// Workflow status
// Matches client_hpc_entries.status ENUM in database/schema/hpc_schema.sql
// ============================================================
export type WorkflowStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'FINALIZED';

// ============================================================
// Competency
// Matches client_hpc_competencies table
// ============================================================
export interface Competency {
  id: number;
  org_id: number;
  domain_code: string;
  domain_name: string;
  competency_code: string;
  competency_name: string;
  descriptor_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetencyInput {
  domain_code: string;
  domain_name: string;
  competency_code: string;
  competency_name: string;
  descriptor_text?: string;
  display_order?: number;
  is_active?: boolean;
}

// ============================================================
// Entry
// Matches result of repository.getStudentEntries (join of
// client_hpc_entries + client_hpc_competencies)
// ============================================================
export interface StudentEntry {
  id: number;
  org_id: number;
  student_id: number;
  academic_cycle_id: number;
  competency_id: number;
  entry_value: string | null;
  remarks: string | null;
  evaluator_id: number | null;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  domain_code: string;
  domain_name: string;
  competency_name: string;
  descriptor_text: string | null;
  display_order: number;
}

export interface SaveDraftEntryInput {
  student_id: number;
  academic_cycle_id: number;
  competency_id: number;
  entry_value: string;
  remarks?: string;
}

// ============================================================
// Domain summary
// Matches repository.getDomainSummary() row shape
// ============================================================
export interface DomainSummaryRow {
  domain_code: string;
  domain_name: string;
  total_competencies: number;
  completed_entries: number;
}

// ============================================================
// Progress
// Matches service.getProgress() return shape
// ============================================================
export interface Progress {
  completed: number;
  total: number;
  percentage: number;
}

// ============================================================
// Holistic preview
// Matches service.getHolisticPreview() return shape
// ============================================================
export interface PreviewCompetencyRow {
  domain_name: string;
  competency_name: string;
  descriptor_text: string | null;
  entry_value: string | null;
  remarks: string | null;
  status: WorkflowStatus | null;
  updated_at: string | null;
}

export interface HolisticPreview {
  progress: Progress;
  competencies: PreviewCompetencyRow[];
}

// ============================================================
// Dashboard
// Matches repository.getDashboardStatistics() row shape
// ============================================================
export interface DashboardStatistics {
  total_students: number;
  draft_cards: number;
  in_progress_cards: number;
  ready_for_review_cards: number;
  finalized_cards: number;
}

export interface RecentActivityRow {
  student_id: number;
  competency_id: number;
  entry_value: string | null;
  status: WorkflowStatus;
  updated_at: string;
}

export interface DashboardOverview {
  statistics: DashboardStatistics;
  recentActivity: RecentActivityRow[];
}

// ============================================================
// Finalized cards
// Matches client_hpc_cards table / repository query projections
// ============================================================
export interface FinalizedCardSummary {
  id: number;
  student_id: number;
  academic_cycle_id: number;
  finalized_at: string;
  finalized_by: number | null;
}

export interface FinalizedCard {
  id: number;
  org_id: number;
  student_id: number;
  academic_cycle_id: number;
  status: 'FINALIZED';
  snapshot_json: string;
  finalized_by: number | null;
  finalized_at: string;
  created_at: string;
}

export interface CardSnapshot {
  studentId: string | number;
  academicCycleId: string | number;
  generatedAt: string;
  progress: Progress;
  summary: DomainSummaryRow[];
  competencies: PreviewCompetencyRow[];
}

export interface PdfPayload {
  id: number;
  student_id: number;
  academic_cycle_id: number;
  status: string;
  snapshot_json: string;
  finalized_by: number | null;
  finalized_at: string;
}

export interface FinalizeReportCardInput {
  student_id: number;
  academic_cycle_id: number;
}

export interface FinalizeReportCardResult {
  success: boolean;
  message: string;
  snapshot: CardSnapshot;
}
