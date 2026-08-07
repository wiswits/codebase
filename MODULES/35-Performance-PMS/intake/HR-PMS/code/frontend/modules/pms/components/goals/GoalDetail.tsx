"use client";

import Link from "next/link";
import { useState } from "react";
import { useCycles } from "../../hooks/use-cycles";
import { useGoal, useUpdateGoal } from "../../hooks/use-goals";
import { GOAL_STATUS_LABELS, PMS_ROUTES } from "../../constants";
import { Badge, goalStatusTone } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";
import { ErrorState, LoadingState, NotFoundState } from "../shared/DataStates";
import { GoalForm } from "./GoalForm";

export function GoalDetail({ goalId }: { goalId: string }) {
  const { goalState, refetchGoal } = useGoal(goalId);
  const { cyclesState } = useCycles();
  const { submit, submitting, error, clearError } = useUpdateGoal();
  const [editing, setEditing] = useState(false);

  if (goalState.status === "loading" || goalState.status === "idle") {
    return <LoadingState label="Loading goal…" />;
  }
  if (goalState.status === "not_found") {
    return <NotFoundState message="This goal does not exist or was removed." />;
  }
  if (goalState.status === "error") {
    return <ErrorState message={goalState.error.message} onRetry={refetchGoal} />;
  }
  if (goalState.status === "empty" || goalState.status === "unauthorized") {
    return <NotFoundState message="This goal does not exist or was removed." />;
  }

  const goal = goalState.data;
  const cycles = cyclesState.status === "success" ? cyclesState.data : [];

  return (
    <div className="flex flex-col gap-6">
      <Link href={PMS_ROUTES.goals} className="text-sm text-[#1F3A5F] hover:underline">
        ← Back to goals
      </Link>

      {editing ? (
        <Card>
          <GoalForm
            cycles={cycles}
            initial={goal}
            submitting={submitting}
            serverError={error}
            onSubmit={async (payload) => {
              const updated = await submit(goal.id, payload);
              if (updated) {
                setEditing(false);
                refetchGoal();
              }
            }}
            onCancel={() => setEditing(false)}
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{goal.title}</h2>
              {goal.description && <p className="mt-1 text-sm text-slate-500">{goal.description}</p>}
            </div>
            <Badge tone={goalStatusTone(goal.status)}>{GOAL_STATUS_LABELS[goal.status]}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Owner</dt>
              <dd className="font-medium text-slate-800">{goal.employeeName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Weight</dt>
              <dd className="font-medium text-slate-800">{goal.weight ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Due date</dt>
              <dd className="font-medium text-slate-800">{goal.dueDate ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="font-medium text-slate-800">
                {new Date(goal.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
          <div className="mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                clearError();
                setEditing(true);
              }}
            >
              Edit goal
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
