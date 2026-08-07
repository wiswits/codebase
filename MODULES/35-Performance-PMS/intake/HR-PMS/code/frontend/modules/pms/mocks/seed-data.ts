import type {
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  PmsCurrentUser,
} from "../types";

/**
 * MOCK DEVELOPMENT DATA ONLY.
 *
 * This file exists so Jatin's frontend can be built and demoed before the
 * real EduSuite backend/database exists. Nothing here is an authoritative
 * business rule — statuses, sample names and dates are illustrative only.
 * Respects a single mock tenant (org) throughout, per tenant-isolation
 * standards (data is never cross-org even in mock form).
 */

const ORG_ID = "org_edusuite_demo";

export const MOCK_CURRENT_USERS: Record<string, PmsCurrentUser> = {
  employee: {
    id: "user_priya",
    name: "Priya Nair",
    orgId: ORG_ID,
    permissions: ["hr.pms.view"],
  },
  manager: {
    id: "user_arjun",
    name: "Arjun Mehta",
    orgId: ORG_ID,
    permissions: ["hr.pms.view", "hr.pms.review"],
  },
  hrAdmin: {
    id: "user_neha_hr",
    name: "Neha Kapoor",
    orgId: ORG_ID,
    permissions: ["hr.pms.view", "hr.pms.review", "hr.pms.manage"],
  },
};

export const DEFAULT_MOCK_ROLE: keyof typeof MOCK_CURRENT_USERS = "manager";

let cycleSeq = 3;
let goalSeq = 4;
let reviewSeq = 3;

export const seedCycles: AppraisalCycle[] = [
  {
    id: "cycle_1",
    orgId: ORG_ID,
    name: "H1 2026 Performance Cycle",
    description: "First-half appraisal cycle covering goal setting through rating summary.",
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    status: "in_review",
    goalCount: 2,
    reviewCount: 2,
    createdAt: "2025-12-15T09:00:00.000Z",
    updatedAt: "2026-06-20T10:30:00.000Z",
  },
  {
    id: "cycle_2",
    orgId: ORG_ID,
    name: "H2 2026 Performance Cycle",
    description: "Second-half appraisal cycle, currently active for goal setting.",
    startDate: "2026-07-01",
    endDate: "2026-12-31",
    status: "active",
    goalCount: 2,
    reviewCount: 0,
    createdAt: "2026-06-25T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "cycle_3",
    orgId: ORG_ID,
    name: "2025 Annual Cycle",
    description: "Closed prior-year annual appraisal cycle, retained for reference.",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "closed",
    goalCount: 0,
    reviewCount: 0,
    createdAt: "2025-01-05T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
];

export const seedGoals: AppraisalGoal[] = [
  {
    id: "goal_1",
    orgId: ORG_ID,
    cycleId: "cycle_1",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    title: "Ship the new billing reconciliation module",
    description: "Deliver end-to-end reconciliation workflow with reviewer sign-off.",
    weight: 40,
    status: "completed",
    dueDate: "2026-05-30",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-05-28T09:00:00.000Z",
  },
  {
    id: "goal_2",
    orgId: ORG_ID,
    cycleId: "cycle_1",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    title: "Mentor two junior engineers",
    description: "Run weekly pairing sessions and track onboarding milestones.",
    weight: 20,
    status: "in_progress",
    dueDate: "2026-06-15",
    createdAt: "2026-01-10T09:05:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "goal_3",
    orgId: ORG_ID,
    cycleId: "cycle_2",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    title: "Lead migration to the shared component library",
    description: "Coordinate rollout across three modules without regressions.",
    weight: 50,
    status: "not_started",
    dueDate: "2026-11-30",
    createdAt: "2026-07-02T09:00:00.000Z",
    updatedAt: "2026-07-02T09:00:00.000Z",
  },
  {
    id: "goal_4",
    orgId: ORG_ID,
    cycleId: "cycle_2",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    title: "Improve test coverage for the PMS module",
    status: "not_started",
    dueDate: "2026-10-15",
    createdAt: "2026-07-02T09:10:00.000Z",
    updatedAt: "2026-07-02T09:10:00.000Z",
  },
];

export const seedReviews: AppraisalReview[] = [
  {
    id: "review_1",
    orgId: ORG_ID,
    cycleId: "cycle_1",
    goalId: "goal_1",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    reviewType: "self",
    status: "submitted",
    rating: 4,
    comments:
      "I delivered the reconciliation module ahead of schedule and worked closely with QA to close out edge cases.",
    strengths: "Ownership, attention to detail.",
    improvementAreas: "Could delegate more of the QA verification work.",
    submittedAt: "2026-06-05T12:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-05T12:00:00.000Z",
  },
  {
    id: "review_2",
    orgId: ORG_ID,
    cycleId: "cycle_1",
    goalId: "goal_1",
    employeeId: "user_priya",
    employeeName: "Priya Nair",
    reviewerId: "user_arjun",
    reviewerName: "Arjun Mehta",
    reviewType: "reviewer",
    status: "draft",
    comments: "",
    createdAt: "2026-06-06T09:00:00.000Z",
    updatedAt: "2026-06-06T09:00:00.000Z",
  },
];

export function nextCycleId(): string {
  cycleSeq += 1;
  return `cycle_${cycleSeq}`;
}

export function nextGoalId(): string {
  goalSeq += 1;
  return `goal_${goalSeq}`;
}

export function nextReviewId(): string {
  reviewSeq += 1;
  return `review_${reviewSeq}`;
}

export const MOCK_ORG_ID = ORG_ID;
