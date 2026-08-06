"use client";

import { useState } from "react";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycles } from "../../hooks/use-cycles";
import { useReviews, useSubmitReview } from "../../hooks/use-reviews";
import { PMS_PERMISSIONS } from "../../constants";
import { Badge } from "../shared/Badge";
import { Card } from "../shared/Card";
import { Button } from "../shared/Button";
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from "../shared/DataStates";
import { SelectField } from "../shared/FormField";
import { ReviewerForm } from "./ReviewerForm";

export function ReviewerQueue() {
  const { currentUser, hasPermission } = usePmsUser();
  const { cyclesState } = useCycles();
  const [cycleId, setCycleId] = useState<string>("");
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const eligibleCycles =
    cyclesState.status === "success"
      ? cyclesState.data.filter((c) => c.status === "active" || c.status === "in_review")
      : [];
  const effectiveCycleId = cycleId || eligibleCycles[0]?.id || "";

  const { reviewsState: selfReviewsState, refetchReviews: refetchSelf } = useReviews({
    cycleId: effectiveCycleId || undefined,
    reviewType: "self",
  });
  const { reviewsState: reviewerReviewsState, refetchReviews: refetchReviewer } = useReviews({
    cycleId: effectiveCycleId || undefined,
    reviewType: "reviewer",
  });
  const { submit, update, submitting, error, success, resetSuccess } = useSubmitReview();

  if (!hasPermission(PMS_PERMISSIONS.REVIEW)) {
    return (
      <UnauthorizedState message="Reviewer access is required to complete reviews. Ask HR to grant the hr.pms.review permission." />
    );
  }

  if (cyclesState.status === "loading") {
    return <LoadingState label="Loading appraisal cycles…" />;
  }
  if (eligibleCycles.length === 0) {
    return (
      <EmptyState
        title="No open cycle for reviews"
        description="Reviewer forms open once HR activates an appraisal cycle."
      />
    );
  }

  const loading = selfReviewsState.status === "loading" || reviewerReviewsState.status === "loading";
  if (loading) {
    return <LoadingState label="Loading review queue…" />;
  }
  if (selfReviewsState.status === "error") {
    return <ErrorState message={selfReviewsState.error.message} onRetry={refetchSelf} />;
  }
  if (reviewerReviewsState.status === "error") {
    return <ErrorState message={reviewerReviewsState.error.message} onRetry={refetchReviewer} />;
  }

  const submittedSelfReviews =
    selfReviewsState.status === "success"
      ? selfReviewsState.data.filter((r) => r.status === "submitted")
      : [];
  const reviewerReviews = reviewerReviewsState.status === "success" ? reviewerReviewsState.data : [];

  const rows = submittedSelfReviews.map((selfReview) => ({
  id: selfReview.id,
  employeeId: selfReview.employeeId,
  employeeName: selfReview.employeeName,
  selfReview,
  reviewerReview: reviewerReviews.find(
    (r) =>
      r.employeeId === selfReview.employeeId &&
      r.goalId === selfReview.goalId
  ),
}));

const activeRow = rows.find((r) => r.id === activeReviewId);
  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <SelectField
          label="Appraisal cycle"
          value={effectiveCycleId}
          onChange={(v) => {
            setActiveReviewId(null);
            setCycleId(v);
          }}
          options={eligibleCycles.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No self reviews submitted yet"
          description="Reviews will appear here once an employee submits their self review for this cycle."
        />
      ) : (
        <Card>
          <table className="w-full min-w-130 text-left text-sm">
            <caption className="sr-only">Employees awaiting or completed reviewer review</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Employee
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Self Review
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Reviewer Status
                </th>
                <th scope="col" className="py-2 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-800">{row.employeeName}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="success">Submitted</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={row.reviewerReview?.status === "submitted" ? "success" : "warning"}>
                      {row.reviewerReview?.status === "submitted" ? "Submitted" : "Pending"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        resetSuccess();
                        setActiveReviewId(row.id);
                      }}
                    >
                      {row.reviewerReview ? "View / Edit" : "Start review"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeRow && (
        <div>
          {success && (
            <p role="status" className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Review saved successfully.
            </p>
          )}
          <ReviewerForm
            employeeName={activeRow.employeeName}
            existingReview={activeRow.reviewerReview}
            submitting={submitting}
            serverError={error}
            onCancel={() => setActiveReviewId(null)}
            onSubmit={async (values) => {
              if (activeRow.reviewerReview) {
                await update(activeRow.reviewerReview.id, values);
              } else {
                await submit(
                  {
                    cycleId: effectiveCycleId,
                    employeeId: activeRow.employeeId,
                    goalId: activeRow.selfReview.goalId,
                    reviewType: "reviewer",
                    ...values,
                  },
                  currentUser,
                );
              }
              refetchReviewer();
            }}
          />
        </div>
      )}
    </div>
  );
}
