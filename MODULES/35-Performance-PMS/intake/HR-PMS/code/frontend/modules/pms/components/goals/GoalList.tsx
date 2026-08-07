"use client";

import Link from "next/link";
import { useState } from "react";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycles } from "../../hooks/use-cycles";
import { useCreateGoal, useGoals } from "../../hooks/use-goals";
import { GOAL_STATUS_LABELS, PMS_ROUTES } from "../../constants";
import { Badge, goalStatusTone } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";
import { EmptyState, ErrorState, LoadingState } from "../shared/DataStates";
import { GoalForm } from "./GoalForm";

export function GoalList() {
  const { currentUser } = usePmsUser();
  const { cyclesState } = useCycles();
  const { goalsState, refetchGoals } = useGoals();
  const { submit, submitting, error, clearError } = useCreateGoal();
  const [showForm, setShowForm] = useState(false);

  if (goalsState.status === "loading" || goalsState.status === "idle" || cyclesState.status === "loading") {
    return <LoadingState label="Loading goals…" />;
  }

  if (goalsState.status === "error") {
    return <ErrorState message={goalsState.error.message} onRetry={refetchGoals} />;
  }
  if (goalsState.status === "unauthorized" || goalsState.status === "not_found") {
    return <ErrorState message="Unable to load goals." onRetry={refetchGoals} />;
  }

  const cycles = cyclesState.status === "success" ? cyclesState.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Goals</h2>
        <Button
          size="sm"
          disabled={cycles.length === 0}
          onClick={() => {
            clearError();
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "Cancel" : "Add Goal"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <GoalForm
            cycles={cycles}
            submitting={submitting}
            serverError={error}
            onSubmit={async (payload) => {
              const created = await submit(payload, currentUser);
              if (created) {
                setShowForm(false);
                refetchGoals();
              }
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {goalsState.status === "empty" ? (
        <EmptyState
          title="No goals yet"
          description="Add a goal to start tracking progress for the current cycle."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalsState.data.map((goal) => (
            <Link key={goal.id} href={PMS_ROUTES.goalDetail(goal.id)} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                  <Badge tone={goalStatusTone(goal.status)}>{GOAL_STATUS_LABELS[goal.status]}</Badge>
                </div>
                {goal.description && <p className="mt-2 text-sm text-slate-500">{goal.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  {goal.weight !== undefined && <span>Weight: {goal.weight}%</span>}
                  {goal.dueDate && <span>Due {goal.dueDate}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
