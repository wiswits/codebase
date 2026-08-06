import type {
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  RatingSummary,
} from "../types";

/* ============================================================
   CYCLE MAPPER
============================================================ */

export function mapCycle(data: any): AppraisalCycle {
  return {
    id: String(data.id),
    orgId: String(data.org_id ?? ""),

    name: data.cycle_name ?? data.name ?? "",

    description: data.description ?? "",

    startDate: data.start_date ?? data.startDate ?? "",

    endDate: data.end_date ?? data.endDate ?? "",

    status: data.status ?? "draft",

    goalCount: Number(data.goal_count ?? data.goalCount ?? 0),

    reviewCount: Number(data.review_count ?? data.reviewCount ?? 0),

    createdAt: data.created_at ?? data.createdAt ?? "",

    updatedAt: data.updated_at ?? data.updatedAt ?? "",
  };
}

/* ============================================================
   GOAL MAPPER
============================================================ */

export function mapGoal(data: any): AppraisalGoal {
  return {
    id: String(data.id),

    orgId: String(data.org_id ?? ""),

    cycleId: String(data.cycle_id ?? data.cycleId ?? ""),

    employeeId: String(data.employee_id ?? data.employeeId ?? ""),

    employeeName:
      data.employee_name ??
      data.employeeName ??
      "",

    title:
      data.goal_title ??
      data.title ??
      "",

    description:
      data.goal_description ??
      data.description ??
      "",

    weight:
      data.weight ??
      data.weightage ??
      undefined,

    status:
      data.status ??
      "not_started",

    dueDate:
      data.due_date ??
      data.target_value ??
      data.dueDate ??
      undefined,

    createdAt:
      data.created_at ??
      data.createdAt ??
      "",

    updatedAt:
      data.updated_at ??
      data.updatedAt ??
      "",
  };
}

/* ============================================================
   REVIEW MAPPER
============================================================ */

export function mapReview(data: any): AppraisalReview {
  return {
    id: String(data.id),

    orgId: String(data.org_id ?? ""),

    cycleId: String(data.cycle_id ?? ""),

    goalId:
      data.goal_id != null
        ? String(data.goal_id)
        : undefined,

    employeeId: String(data.employee_id ?? ""),

    employeeName:
      data.employee_name ??
      data.employeeName ??
      "",

    reviewerId:
      data.reviewer_id != null
        ? String(data.reviewer_id)
        : undefined,

    reviewerName:
      data.reviewer_name ??
      data.reviewerName ??
      undefined,

    reviewType:
      data.review_type ??
      data.reviewType,

    status:
      data.review_status ??
      data.status ??
      "draft",

    rating:
      data.rating != null
        ? Number(data.rating)
        : undefined,

    comments:
      data.comments ??
      "",

    strengths:
      data.strengths ??
      "",

    improvementAreas:
  data.improvement_areas ??
  data.improvements ??
  data.improvementAreas ??
  "",

    submittedAt:
      data.submitted_at ??
      data.submittedAt ??
      undefined,

    createdAt:
      data.created_at ??
      data.createdAt ??
      "",

    updatedAt:
      data.updated_at ??
      data.updatedAt ??
      "",
  };
}

/* ============================================================
   SUMMARY MAPPER
============================================================ */

export function mapSummary(data: any): RatingSummary {
  return {
    cycleId: String(data.cycle_id ?? ""),

    cycleName:
      data.cycle_name ??
      data.cycleName ??
      "",

    employeeId: String(data.employee_id ?? ""),

    employeeName:
      data.employee_name ??
      data.employeeName ??
      "",

    selfReview:
      data.self_review
        ? mapReview(data.self_review)
        : undefined,

    reviewerReview:
      data.reviewer_review
        ? mapReview(data.reviewer_review)
        : undefined,

    overallRating:
      data.overall_rating ??
      data.overallRating,

    status:
      data.status ??
      "pending",

    updatedAt:
      data.updated_at ??
      data.updatedAt ??
      "",
  };
}