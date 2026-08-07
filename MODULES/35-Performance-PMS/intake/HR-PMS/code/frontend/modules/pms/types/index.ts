/**
 * HR-PMS (Performance Management & Appraisal) — Domain Types
 *
 * Frontend contribution owned by: Jatin
 * Module key: hr_pms (see modules/pms/constants)
 *
 * NOTE ON SOURCE OF TRUTH:
 * These types represent the FRONTEND's understanding of the domain model,
 * derived from the supplied HR-PMS Module Engineering Contract and the
 * WisWits Engineering Standards. The backend (Neha) and database (Khushboo)
 * are the ultimate authority. Where the contract did not fully specify a
 * shape, the safest, most API-ready representation was chosen and is called
 * out in README.md under "Contract Assumptions".
 */

// ---------------------------------------------------------------------------
// Shared API envelope (per Engineering Standards §22, §26)
// ---------------------------------------------------------------------------

export interface APIError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface APISuccess<T> {
  success: true;
  data: T;
}

export interface APIFailure {
  success: false;
  error: APIError;
}

export type APIResponse<T> = APISuccess<T> | APIFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Permissions (per contract: hr.pms.view / hr.pms.review / hr.pms.manage)
// ---------------------------------------------------------------------------

export type PmsPermission = "hr.pms.view" | "hr.pms.review" | "hr.pms.manage";

/**
 * Frontend-only representation of the authenticated user, scoped to what the
 * PMS module needs. The real shape will come from the existing WisWits
 * auth/RBAC mechanism — this is intentionally minimal and API-ready.
 *
 * IMPORTANT: This is a UX convenience only. It is never treated as the
 * authorization source; the backend enforces permissions independently.
 */
export interface PmsCurrentUser {
  id: string;
  name: string;
  orgId: string;
  permissions: PmsPermission[];
}

// ---------------------------------------------------------------------------
// Appraisal Cycle
// ---------------------------------------------------------------------------

/**
 * Cycle status values used for UI/demo purposes only. The contract does not
 * lock a specific status enum, so this is clearly isolated as a frontend
 * working assumption (see README "Contract Assumptions").
 */
export type AppraisalCycleStatus =
  | "draft"
  | "active"
  | "in_review"
  | "closed";

export interface AppraisalCycle {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  startDate: string; // ISO-8601
  endDate: string; // ISO-8601
  status: AppraisalCycleStatus;
  goalCount: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppraisalCyclePayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: AppraisalCycleStatus;
}

export type UpdateAppraisalCyclePayload = Partial<CreateAppraisalCyclePayload>;

// ---------------------------------------------------------------------------
// Appraisal Goal
// ---------------------------------------------------------------------------

export type AppraisalGoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface AppraisalGoal {
  id: string;
  orgId: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description?: string;
  weight?: number; // 0-100, optional; display-only, not a computed score
  status: AppraisalGoalStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppraisalGoalPayload {
  cycleId: string;
  title: string;
  description?: string;
  weight?: number;
  status: AppraisalGoalStatus;
  dueDate?: string;
}

export type UpdateAppraisalGoalPayload = Partial<CreateAppraisalGoalPayload>;

// ---------------------------------------------------------------------------
// Appraisal Review — Self Review & Reviewer Form
// ---------------------------------------------------------------------------

/**
 * CRITICAL DOMAIN RULE: review type is restricted to exactly these two
 * values. Do not introduce peer / 360 / principal / hr / external review
 * types on the frontend — the contract defines only "self" and "reviewer".
 */
export type ReviewType = "self" | "reviewer";

export type AppraisalReviewStatus = "draft" | "submitted";

export interface AppraisalReview {
  id: string;
  orgId: string;
  cycleId: string;
  goalId?: string;
  employeeId: string;
  employeeName: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewType: ReviewType;
  status: AppraisalReviewStatus;
  rating?: number; // raw rating value as supplied/entered; frontend never computes this
  comments: string;
  strengths?: string;
  improvementAreas?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSelfReviewPayload {
  cycleId: string;
  goalId?: string;
  reviewType: "self";
  rating?: number;
  comments: string;
  strengths?: string;
  improvementAreas?: string;
  status: AppraisalReviewStatus;
}

export interface CreateReviewerReviewPayload {
  cycleId: string;
  employeeId: string;
  goalId?: string;
  reviewType: "reviewer";
  rating?: number;
  comments: string;
  strengths?: string;
  improvementAreas?: string;
  status: AppraisalReviewStatus;
}

export type CreateAppraisalReviewPayload =
  | CreateSelfReviewPayload
  | CreateReviewerReviewPayload;

export type UpdateAppraisalReviewPayload = Partial<
  Pick<
    AppraisalReview,
    "rating" | "comments" | "strengths" | "improvementAreas" | "status"
  >
>;

// ---------------------------------------------------------------------------
// Rating Summary
// ---------------------------------------------------------------------------

/**
 * The frontend NEVER computes a weighted rating/score. This shape only
 * displays whatever representation the backend/API supplies. Fields here
 * mirror what a summary endpoint would reasonably return; no formula is
 * implied or implemented client-side.
 */
export interface RatingSummary {
  cycleId: string;
  cycleName: string;
  employeeId: string;
  employeeName: string;
  selfReview?: AppraisalReview;
  reviewerReview?: AppraisalReview;
  /** Opaque, backend-supplied overall rating representation, if provided. */
  overallRating?: number | string;
  status: "pending" | "in_review" | "completed";
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// UI-only state helpers
// ---------------------------------------------------------------------------

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; error: APIError }
  | { status: "unauthorized" }
  | { status: "not_found" };

export interface FormSubmitState {
  submitting: boolean;
  success: boolean;
  error?: APIError;
  fieldErrors?: Record<string, string>;
}
