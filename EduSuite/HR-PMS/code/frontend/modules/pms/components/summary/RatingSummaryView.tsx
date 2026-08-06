"use client";

import { useState } from "react";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycles } from "../../hooks/use-cycles";
import { useRatingSummary } from "../../hooks/use-summary";
import { Badge } from "../shared/Badge";
import { Card } from "../shared/Card";
import { EmptyState, ErrorState, LoadingState, NotFoundState } from "../shared/DataStates";
import { SelectField } from "../shared/FormField";

const STATUS_TONE = {
  pending: "neutral",
  in_review: "warning",
  completed: "success",
} as const;

const STATUS_LABEL = {
  pending: "Pending",
  in_review: "In Review",
  completed: "Completed",
} as const;

export function RatingSummaryView() {
  const { currentUser } = usePmsUser();
  const { cyclesState } = useCycles();
  const [cycleId, setCycleId] = useState<string>("");

  const cycles = cyclesState.status === "success" ? cyclesState.data : [];
  const effectiveCycleId = cycleId || cycles[0]?.id || "";

  const { summaryState, refetchSummary } = useRatingSummary(effectiveCycleId, currentUser.id);

  if (cyclesState.status === "loading") {
    return <LoadingState label="Loading appraisal cycles…" />;
  }
  if (cycles.length === 0) {
    return <EmptyState title="No appraisal cycles available" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <SelectField
          label="Appraisal cycle"
          value={effectiveCycleId}
          onChange={setCycleId}
          options={cycles.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      {summaryState.status === "loading" || summaryState.status === "idle" ? (
        <LoadingState label="Loading rating summary…" />
      ) : summaryState.status === "not_found" ? (
        <NotFoundState message="No summary is available for this cycle yet." />
      ) : summaryState.status === "error" ? (
        <ErrorState message={summaryState.error.message} onRetry={refetchSummary} />
      ) : summaryState.status === "success" ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{summaryState.data.cycleName}</h2>
              <p className="mt-1 text-sm text-slate-500">{summaryState.data.employeeName}</p>
            </div>
            <Badge tone={STATUS_TONE[summaryState.data.status]}>
              {STATUS_LABEL[summaryState.data.status]}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Self Review</h3>
              {summaryState.data.selfReview ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">{summaryState.data.selfReview.comments}</p>
                  {summaryState.data.selfReview.rating !== undefined && (
                    <p className="mt-2 text-xs text-slate-500">
                      Self rating: {summaryState.data.selfReview.rating}/5
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Not yet submitted.</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Reviewer Review</h3>
              {summaryState.data.reviewerReview ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">{summaryState.data.reviewerReview.comments}</p>
                  {summaryState.data.reviewerReview.rating !== undefined && (
                    <p className="mt-2 text-xs text-slate-500">
                      Reviewer rating: {summaryState.data.reviewerReview.rating}/5
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Not yet submitted.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Overall Rating</h3>
            <p className="mt-1 text-sm text-slate-600">
              {summaryState.data.overallRating !== undefined
                ? summaryState.data.overallRating
                : "Not yet available — supplied by the reviewer/backend, not calculated by this screen."}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
