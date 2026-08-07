import type {
  APIResponse,
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  CreateAppraisalCyclePayload,
  CreateAppraisalGoalPayload,
  CreateAppraisalReviewPayload,
  RatingSummary,
  UpdateAppraisalCyclePayload,
  UpdateAppraisalGoalPayload,
  UpdateAppraisalReviewPayload,
} from "../types";
import {
  MOCK_ORG_ID,
  nextCycleId,
  nextGoalId,
  nextReviewId,
  seedCycles,
  seedGoals,
  seedReviews,
} from "./seed-data";

/**
 * In-memory mock "database" for standalone frontend development.
 *
 * This module simulates realistic API behavior — network latency and
 * error-shaped responses — so that components, hooks and services are
 * written exactly the way they will behave against the real WisWits
 * backend. Swapping this out for `http-client.ts` in each service file is
 * the only change required to go live.
 */

let cycles: AppraisalCycle[] = [...seedCycles];
let goals: AppraisalGoal[] = [...seedGoals];
let reviews: AppraisalReview[] = [...seedReviews];

const LATENCY_MS = 450;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function ok<T>(data: T): APIResponse<T> {
  return { success: true, data };
}

function fail<T>(code: string, message: string, fieldErrors?: Record<string, string>): APIResponse<T> {
  return { success: false, error: { code, message, fieldErrors } };
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Cycles
// ---------------------------------------------------------------------------

export async function mockListCycles(): Promise<APIResponse<AppraisalCycle[]>> {
  return delay(ok(cycles.filter((c) => c.orgId === MOCK_ORG_ID)));
}

export async function mockGetCycle(id: string): Promise<APIResponse<AppraisalCycle>> {
  const cycle = cycles.find((c) => c.id === id && c.orgId === MOCK_ORG_ID);
  if (!cycle) {
    return delay(fail("CYCLE_NOT_FOUND", "This appraisal cycle could not be found."));
  }
  return delay(ok(cycle));
}

export async function mockCreateCycle(
  payload: CreateAppraisalCyclePayload,
): Promise<APIResponse<AppraisalCycle>> {
  const fieldErrors: Record<string, string> = {};
  if (!payload.name?.trim()) fieldErrors.name = "Cycle name is required.";
  if (!payload.startDate) fieldErrors.startDate = "Start date is required.";
  if (!payload.endDate) fieldErrors.endDate = "End date is required.";
  if (
    payload.startDate &&
    payload.endDate &&
    new Date(payload.startDate) >= new Date(payload.endDate)
  ) {
    fieldErrors.endDate = "End date must be after the start date.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return delay(fail("VALIDATION_ERROR", "Please fix the highlighted fields.", fieldErrors));
  }

  const cycle: AppraisalCycle = {
    id: nextCycleId(),
    orgId: MOCK_ORG_ID,
    name: payload.name,
    description: payload.description,
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status,
    goalCount: 0,
    reviewCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  cycles = [cycle, ...cycles];
  return delay(ok(cycle));
}

export async function mockUpdateCycle(
  id: string,
  payload: UpdateAppraisalCyclePayload,
): Promise<APIResponse<AppraisalCycle>> {
  const index = cycles.findIndex((c) => c.id === id && c.orgId === MOCK_ORG_ID);
  if (index === -1) {
    return delay(fail("CYCLE_NOT_FOUND", "This appraisal cycle could not be found."));
  }
  if (
    payload.startDate &&
    payload.endDate &&
    new Date(payload.startDate) >= new Date(payload.endDate)
  ) {
    return delay(
      fail("VALIDATION_ERROR", "Please fix the highlighted fields.", {
        endDate: "End date must be after the start date.",
      }),
    );
  }
  const updated: AppraisalCycle = {
    ...cycles[index],
    ...payload,
    updatedAt: nowIso(),
  };
  cycles = [...cycles.slice(0, index), updated, ...cycles.slice(index + 1)];
  return delay(ok(updated));
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function mockListGoals(cycleId?: string): Promise<APIResponse<AppraisalGoal[]>> {
  const scoped = goals.filter(
    (g) => g.orgId === MOCK_ORG_ID && (!cycleId || g.cycleId === cycleId),
  );
  return delay(ok(scoped));
}

export async function mockGetGoal(id: string): Promise<APIResponse<AppraisalGoal>> {
  const goal = goals.find((g) => g.id === id && g.orgId === MOCK_ORG_ID);
  if (!goal) {
    return delay(fail("GOAL_NOT_FOUND", "This goal could not be found."));
  }
  return delay(ok(goal));
}

export async function mockCreateGoal(
  payload: CreateAppraisalGoalPayload,
  currentUser: { id: string; name: string },
): Promise<APIResponse<AppraisalGoal>> {
  const fieldErrors: Record<string, string> = {};
  if (!payload.title?.trim()) fieldErrors.title = "Goal title is required.";
  if (!payload.cycleId) fieldErrors.cycleId = "An appraisal cycle must be selected.";
  if (payload.weight !== undefined && (payload.weight < 0 || payload.weight > 100)) {
    fieldErrors.weight = "Weight must be between 0 and 100.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return delay(fail("VALIDATION_ERROR", "Please fix the highlighted fields.", fieldErrors));
  }

  const goal: AppraisalGoal = {
    id: nextGoalId(),
    orgId: MOCK_ORG_ID,
    cycleId: payload.cycleId,
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    title: payload.title,
    description: payload.description,
    weight: payload.weight,
    status: payload.status,
    dueDate: payload.dueDate,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  goals = [goal, ...goals];
  return delay(ok(goal));
}

export async function mockUpdateGoal(
  id: string,
  payload: UpdateAppraisalGoalPayload,
): Promise<APIResponse<AppraisalGoal>> {
  const index = goals.findIndex((g) => g.id === id && g.orgId === MOCK_ORG_ID);
  if (index === -1) {
    return delay(fail("GOAL_NOT_FOUND", "This goal could not be found."));
  }
  if (payload.weight !== undefined && (payload.weight < 0 || payload.weight > 100)) {
    return delay(
      fail("VALIDATION_ERROR", "Please fix the highlighted fields.", {
        weight: "Weight must be between 0 and 100.",
      }),
    );
  }
  const updated: AppraisalGoal = { ...goals[index], ...payload, updatedAt: nowIso() };
  goals = [...goals.slice(0, index), updated, ...goals.slice(index + 1)];
  return delay(ok(updated));
}

// ---------------------------------------------------------------------------
// Reviews (self + reviewer)
// ---------------------------------------------------------------------------

export async function mockListReviews(filters: {
  cycleId?: string;
  employeeId?: string;
  reviewType?: "self" | "reviewer";
}): Promise<APIResponse<AppraisalReview[]>> {
  const scoped = reviews.filter((r) => {
    if (r.orgId !== MOCK_ORG_ID) return false;
    if (filters.cycleId && r.cycleId !== filters.cycleId) return false;
    if (filters.employeeId && r.employeeId !== filters.employeeId) return false;
    if (filters.reviewType && r.reviewType !== filters.reviewType) return false;
    return true;
  });
  return delay(ok(scoped));
}

export async function mockGetReview(id: string): Promise<APIResponse<AppraisalReview>> {
  const review = reviews.find((r) => r.id === id && r.orgId === MOCK_ORG_ID);
  if (!review) {
    return delay(fail("REVIEW_NOT_FOUND", "This review could not be found."));
  }
  return delay(ok(review));
}

export async function mockCreateReview(
  payload: CreateAppraisalReviewPayload,
  currentUser: { id: string; name: string },
): Promise<APIResponse<AppraisalReview>> {
  const fieldErrors: Record<string, string> = {};
  if (!payload.cycleId) fieldErrors.cycleId = "An appraisal cycle is required.";
  if (payload.status === "submitted" && !payload.comments?.trim()) {
    fieldErrors.comments = "Comments are required before submitting.";
  }
  if (
    payload.rating !== undefined &&
    (payload.rating < 1 || payload.rating > 5)
  ) {
    fieldErrors.rating = "Rating must be between 1 and 5.";
  }
  if (payload.reviewType !== "self" && payload.reviewType !== "reviewer") {
    return delay(fail("INVALID_REVIEW_TYPE", "Unsupported review type."));
  }
  if (Object.keys(fieldErrors).length > 0) {
    return delay(fail("VALIDATION_ERROR", "Please fix the highlighted fields.", fieldErrors));
  }

  const isSelf = payload.reviewType === "self";
  const review: AppraisalReview = {
    id: nextReviewId(),
    orgId: MOCK_ORG_ID,
    cycleId: payload.cycleId,
    goalId: payload.goalId,
    employeeId: isSelf ? currentUser.id : payload.employeeId,
    employeeName: isSelf ? currentUser.name : payload.employeeId,
    reviewerId: isSelf ? undefined : currentUser.id,
    reviewerName: isSelf ? undefined : currentUser.name,
    reviewType: payload.reviewType,
    status: payload.status,
    rating: payload.rating,
    comments: payload.comments,
    strengths: payload.strengths,
    improvementAreas: payload.improvementAreas,
    submittedAt: payload.status === "submitted" ? nowIso() : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  reviews = [review, ...reviews];
  return delay(ok(review));
}

export async function mockUpdateReview(
  id: string,
  payload: UpdateAppraisalReviewPayload,
): Promise<APIResponse<AppraisalReview>> {
  const index = reviews.findIndex((r) => r.id === id && r.orgId === MOCK_ORG_ID);
  if (index === -1) {
    return delay(fail("REVIEW_NOT_FOUND", "This review could not be found."));
  }
  if (payload.status === "submitted" && !(payload.comments ?? reviews[index].comments)?.trim()) {
    return delay(
      fail("VALIDATION_ERROR", "Please fix the highlighted fields.", {
        comments: "Comments are required before submitting.",
      }),
    );
  }
  const updated: AppraisalReview = {
    ...reviews[index],
    ...payload,
    submittedAt:
      payload.status === "submitted" ? nowIso() : reviews[index].submittedAt,
    updatedAt: nowIso(),
  };
  reviews = [...reviews.slice(0, index), updated, ...reviews.slice(index + 1)];
  return delay(ok(updated));
}

// ---------------------------------------------------------------------------
// Rating Summary
// ---------------------------------------------------------------------------

export async function mockGetSummary(
  cycleId: string,
  employeeId: string,
): Promise<APIResponse<RatingSummary>> {
  const cycle = cycles.find((c) => c.id === cycleId && c.orgId === MOCK_ORG_ID);
  if (!cycle) {
    return delay(fail("CYCLE_NOT_FOUND", "This appraisal cycle could not be found."));
  }

  const relevantReviews = reviews.filter(
    (r) => r.cycleId === cycleId && r.employeeId === employeeId && r.orgId === MOCK_ORG_ID,
  );
  const selfReview = relevantReviews.find((r) => r.reviewType === "self");
  const reviewerReview = relevantReviews.find((r) => r.reviewType === "reviewer");

  let status: RatingSummary["status"] = "pending";
  if (selfReview?.status === "submitted" && reviewerReview?.status === "submitted") {
    status = "completed";
  } else if (selfReview || reviewerReview) {
    status = "in_review";
  }

  const summary: RatingSummary = {
    cycleId,
    cycleName: cycle.name,
    employeeId,
    employeeName: selfReview?.employeeName ?? reviewerReview?.employeeName ?? employeeId,
    selfReview,
    reviewerReview,
    // Deliberately NOT computed by the frontend — passthrough only, and only
    // when the reviewer has actually supplied a rating. No formula is applied.
    overallRating: reviewerReview?.rating,
    status,
    updatedAt: nowIso(),
  };

  return delay(ok(summary));
}
