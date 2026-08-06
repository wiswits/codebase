"use client";

import { useState } from "react";
import Link from "next/link";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycle, useUpdateCycle } from "../../hooks/use-cycles";
import { useGoals } from "../../hooks/use-goals";
import { CYCLE_STATUS_LABELS, PMS_PERMISSIONS, PMS_ROUTES } from "../../constants";
import { Badge, cycleStatusTone } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";
import {
  ErrorState,
  LoadingState,
  NotFoundState,
  UnauthorizedState,
} from "../shared/DataStates";
import { CycleForm } from "./CycleForm";

export function CycleDetail({ cycleId }: { cycleId: string }) {
  const { hasPermission } = usePmsUser();
  const { cycleState, refetchCycle } = useCycle(cycleId);
  const { goalsState } = useGoals(cycleId);
  const { submit, submitting, error, clearError } = useUpdateCycle();
  const [editing, setEditing] = useState(false);
  const canManage = hasPermission(PMS_PERMISSIONS.MANAGE);

  if (cycleState.status === "loading" || cycleState.status === "idle") {
    return <LoadingState label="Loading cycle…" />;
  }
  if (cycleState.status === "not_found") {
    return <NotFoundState message="This appraisal cycle does not exist or was removed." />;
  }
  if (cycleState.status === "unauthorized") {
    return <UnauthorizedState message="You don't have permission to view this cycle." />;
  }
  if (cycleState.status === "error") {
    return <ErrorState message={cycleState.error.message} onRetry={refetchCycle} />;
  }
  if (cycleState.status === "empty") {
    return <NotFoundState message="This appraisal cycle does not exist or was removed." />;
  }

  const cycle = cycleState.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={PMS_ROUTES.cycles} className="text-sm text-[#1F3A5F] hover:underline">
          ← Back to cycles
        </Link>
      </div>

      {editing ? (
        <Card>
          <CycleForm
            initial={cycle}
            submitting={submitting}
            serverError={error}
            onSubmit={async (payload) => {
              const updated = await submit(cycle.id, payload);
              if (updated) {
                setEditing(false);
                refetchCycle();
              }
            }}
            onCancel={() => setEditing(false)}
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{cycle.name}</h2>
              {cycle.description && <p className="mt-1 text-sm text-slate-500">{cycle.description}</p>}
            </div>
            <Badge tone={cycleStatusTone(cycle.status)}>{CYCLE_STATUS_LABELS[cycle.status]}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Start date</dt>
              <dd className="font-medium text-slate-800">{cycle.startDate}</dd>
            </div>
            <div>
              <dt className="text-slate-500">End date</dt>
              <dd className="font-medium text-slate-800">{cycle.endDate}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Goals</dt>
              <dd className="font-medium text-slate-800">{cycle.goalCount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reviews</dt>
              <dd className="font-medium text-slate-800">{cycle.reviewCount}</dd>
            </div>
          </dl>
          {canManage ? (
            <div className="mt-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clearError();
                  setEditing(true);
                }}
              >
                Edit cycle
              </Button>
            </div>
          ) : (
            <p className="mt-5 text-xs text-slate-400">
              Only HR administrators can edit cycle details.
            </p>
          )}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-slate-900">Goals in this cycle</h3>
        {goalsState.status === "loading" && <p className="mt-2 text-sm text-slate-500">Loading goals…</p>}
        {goalsState.status === "empty" && (
          <p className="mt-2 text-sm text-slate-500">No goals have been added to this cycle yet.</p>
        )}
        {goalsState.status === "success" && (
          <ul className="mt-3 flex flex-col gap-2">
            {goalsState.data.map((goal) => (
              <li key={goal.id}>
                <Link
                  href={PMS_ROUTES.goalDetail(goal.id)}
                  className="block rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  {goal.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
