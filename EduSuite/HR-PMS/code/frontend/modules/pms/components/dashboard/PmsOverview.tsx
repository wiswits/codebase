"use client";

import { usePmsUser } from "../../context/pms-user-context";
import { useCycles } from "../../hooks/use-cycles";
import { useGoals } from "../../hooks/use-goals";
import { useReviews } from "../../hooks/use-reviews";
import { ErrorState, LoadingState } from "../shared/DataStates";
import { QuickLinks } from "./QuickLinks";
import { StatCard } from "./StatCard";

export function PmsOverview() {
  const { currentUser } = usePmsUser();
  const { cyclesState, refetchCycles } = useCycles();
  const { goalsState } = useGoals();
  const { reviewsState } = useReviews({ employeeId: currentUser.id });

  const loading =
    cyclesState.status === "loading" ||
    goalsState.status === "loading" ||
    reviewsState.status === "loading";

  if (loading) {
    return <LoadingState label="Loading your PMS overview…" />;
  }

  if (cyclesState.status === "error") {
    return <ErrorState message={cyclesState.error.message} onRetry={refetchCycles} />;
  }

  const activeCycles =
    cyclesState.status === "success"
      ? cyclesState.data.filter((c) => c.status === "active" || c.status === "in_review")
      : [];
  const goalCount = goalsState.status === "success" ? goalsState.data.length : 0;
  const myReviewCount = reviewsState.status === "success" ? reviewsState.data.length : 0;
  const pendingSelfReview =
    reviewsState.status === "success"
      ? reviewsState.data.filter((r) => r.reviewType === "self" && r.status !== "submitted").length
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active/In-Review Cycles"
          value={activeCycles.length}
          detail={activeCycles.map((c) => c.name).join(", ") || "None currently"}
        />
        <StatCard label="Your Goals" value={goalCount} />
        <StatCard label="Your Reviews" value={myReviewCount} />
        <StatCard
          label="Self Reviews Pending"
          value={pendingSelfReview}
          detail={pendingSelfReview > 0 ? "Action needed" : "All caught up"}
        />
      </div>

      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="mb-3 text-base font-semibold text-slate-900">
          PMS Workflows
        </h2>
        <QuickLinks />
      </section>
    </div>
  );
}
