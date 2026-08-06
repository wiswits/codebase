"use client";

import { useState } from "react";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycles } from "../../hooks/use-cycles";
import { useReviews, useSubmitReview } from "../../hooks/use-reviews";
import { Card } from "../shared/Card";
import { EmptyState, ErrorState, LoadingState } from "../shared/DataStates";
import { SelectField } from "../shared/FormField";
import { SelfReviewForm } from "./SelfReviewForm";

export function SelfReviewPanel() {
  const { currentUser } = usePmsUser();
  const { cyclesState } = useCycles();
  const [cycleId, setCycleId] = useState<string>("");

  const eligibleCycles =
    cyclesState.status === "success"
      ? cyclesState.data.filter((c) => c.status === "active" || c.status === "in_review")
      : [];
  const effectiveCycleId = cycleId || eligibleCycles[0]?.id || "";

  const { reviewsState, refetchReviews } = useReviews({
    cycleId: effectiveCycleId || undefined,
    employeeId: currentUser.id,
    reviewType: "self",
  });
  const { submit, update, submitting, error, success, resetSuccess } = useSubmitReview();

  if (cyclesState.status === "loading") {
    return <LoadingState label="Loading appraisal cycles…" />;
  }
  if (cyclesState.status === "error") {
    return <ErrorState message={cyclesState.error.message} />;
  }
  if (eligibleCycles.length === 0) {
    return (
      <EmptyState
        title="No open cycle for self review"
        description="Self review opens once HR activates an appraisal cycle."
      />
    );
  }

  const existingReview =
    reviewsState.status === "success" ? reviewsState.data[0] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <SelectField
          label="Appraisal cycle"
          value={effectiveCycleId}
          onChange={(v) => {
            resetSuccess();
            setCycleId(v);
          }}
          options={eligibleCycles.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      {reviewsState.status === "loading" && <LoadingState label="Loading your self review…" />}
      {reviewsState.status === "error" && (
        <ErrorState message={reviewsState.error.message} onRetry={refetchReviews} />
      )}

      {(reviewsState.status === "success" || reviewsState.status === "empty") && (
        <Card>
          {success && (
            <p role="status" className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Your self review was saved successfully.
            </p>
          )}
          <SelfReviewForm
            cycleId={effectiveCycleId}
            existingReview={existingReview}
            submitting={submitting}
            serverError={error}
            onSubmit={async (values) => {
              if (existingReview) {
                await update(existingReview.id, values);
              } else {
                await submit(
                  { cycleId: effectiveCycleId, reviewType: "self", ...values },
                  currentUser,
                );
              }
              refetchReviews();
            }}
          />
        </Card>
      )}
    </div>
  );
}
