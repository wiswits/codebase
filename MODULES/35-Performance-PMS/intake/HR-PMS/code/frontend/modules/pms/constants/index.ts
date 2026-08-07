import type {
  AppraisalCycleStatus,
  AppraisalGoalStatus,
  PmsPermission,
} from "../types";

/** Canonical module key. Do not rename/alias without host integration approval. */
export const PMS_MODULE_KEY = "hr_pms" as const;

/**
 * API namespace as proposed by the HR-PMS Module Engineering Contract.
 * This is a TEAM IMPLEMENTATION CONTRACT, not a confirmed production
 * namespace — isolated here so a future rename only touches one file.
 */
export const PMS_API_BASE = "/api/pms" as const;
export const PMS_ROUTES = {
  root: "/hr/pms",
  cycles: "/hr/pms/cycles",
  cycleDetail: (id: string) => `/hr/pms/cycles/${id}`,
  goals: "/hr/pms/goals",
  goalDetail: (id: string) => `/hr/pms/goals/${id}`,
  selfReview: "/hr/pms/self-review",
  reviews: "/hr/pms/reviews",
  summary: "/hr/pms/summary",
} as const;

export const PMS_PERMISSIONS: Record<string, PmsPermission> = {
  VIEW: "hr.pms.view",
  REVIEW: "hr.pms.review",
  MANAGE: "hr.pms.manage",
};

export const CYCLE_STATUS_LABELS: Record<AppraisalCycleStatus, string> = {
  draft: "Draft",
  active: "Active",
  in_review: "In Review",
  closed: "Closed",
};

export const GOAL_STATUS_LABELS: Record<AppraisalGoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const REVIEW_TYPE_LABELS = {
  self: "Self Review",
  reviewer: "Reviewer Review",
} as const;


export const PMS_USE_MOCK = false;

export const PMS_REAL_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000";