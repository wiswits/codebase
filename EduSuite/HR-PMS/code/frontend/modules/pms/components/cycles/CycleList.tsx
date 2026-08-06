"use client";

import Link from "next/link";
import { useState } from "react";
import { usePmsUser } from "../../context/pms-user-context";
import { useCycles, useCreateCycle } from "../../hooks/use-cycles";
import {
  CYCLE_STATUS_LABELS,
  PMS_PERMISSIONS,
  PMS_ROUTES,
} from "../../constants";
import { Badge, cycleStatusTone } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../shared/DataStates";
import { CycleForm } from "./CycleForm";

export function CycleList() {
  const { hasPermission } = usePmsUser();
  const { cyclesState, refetchCycles } = useCycles();
  const { submit, submitting, error, clearError } = useCreateCycle();

  const [showForm, setShowForm] = useState(false);

  const canManage = hasPermission(PMS_PERMISSIONS.MANAGE);

  if (cyclesState.status === "loading" || cyclesState.status === "idle") {
    return <LoadingState label="Loading appraisal cycles..." />;
  }

  if (cyclesState.status === "error") {
    return (
      <ErrorState
        message={cyclesState.error.message}
        onRetry={refetchCycles}
      />
    );
  }

  if (
    cyclesState.status === "unauthorized" ||
    cyclesState.status === "not_found"
  ) {
    return (
      <ErrorState
        message="Unable to load appraisal cycles."
        onRetry={refetchCycles}
      />
    );
  }

  return (
    <div className="space-y-8">

      {/* =======================================================
          HERO HEADER
      ======================================================= */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-[#0F2147] via-[#18345f] to-[#23497d] p-8 text-white shadow-xl">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="space-y-3">

            <span className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100">
              Performance Management
            </span>

            <div>
              <h1 className="text-4xl font-bold">
                Appraisal Cycles
              </h1>

              <p className="mt-2 max-w-2xl text-blue-100">
                Create, monitor and manage employee appraisal cycles from one
                centralized workspace.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-3 gap-4">

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-blue-200">
                Total
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {cyclesState.status === "empty"
                  ? 0
                  : cyclesState.data.length}
              </h2>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-blue-200">
                Active
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {cyclesState.status === "empty"
                  ? 0
                  : cyclesState.data.filter(
                      (c) => c.status === "active"
                    ).length}
              </h2>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wider text-blue-200">
                Reviews
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {cyclesState.status === "empty"
                  ? 0
                  : cyclesState.data.reduce(
                      (sum, c) => sum + c.reviewCount,
                      0
                    )}
              </h2>
            </div>

          </div>

        </div>

      </div>

      {/* =======================================================
          ACTION BAR
      ======================================================= */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            All Appraisal Cycles
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review every cycle, goals and employee progress.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              clearError();
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ New Cycle"}
          </Button>
        )}
      </div>

      {/* =======================================================
          CREATE FORM
      ======================================================= */}

      {showForm && canManage && (
        <Card className="rounded-3xl">
          <CycleForm
            submitting={submitting}
            serverError={error}
            onSubmit={async (payload) => {
              const created = await submit(payload);

              if (created) {
                setShowForm(false);
                refetchCycles();
              }
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}
            {cyclesState.status === "empty" ? (
        <Card className="rounded-3xl">
          <EmptyState
            title="No appraisal cycles yet"
            description={
              canManage
                ? "Create your first appraisal cycle to begin performance reviews across your organization."
                : "HR hasn't opened any appraisal cycles yet. Please check back later."
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cyclesState.data.map((cycle) => (
            <Link
              key={cycle.id}
              href={PMS_ROUTES.cycleDetail(cycle.id)}
              className="group"
            >
              <Card className="h-full overflow-hidden rounded-3xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-[#1F3A5F]/30 hover:shadow-2xl">

                {/* Top Accent */}
                <div className="h-2 w-full bg-linear-to-r from-[#0F2147] via-[#365E9D] to-[#6A93D4]" />

                <div className="space-y-5 p-6">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-[#1F3A5F]">
                        {cycle.name}
                      </h3>

                      {cycle.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {cycle.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm italic text-slate-400">
                          No description available.
                        </p>
                      )}
                    </div>

                    <Badge tone={cycleStatusTone(cycle.status)}>
                      {CYCLE_STATUS_LABELS[cycle.status]}
                    </Badge>

                  </div>

                  {/* Date Section */}
                  <div className="rounded-2xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Duration
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {cycle.startDate} → {cycle.endDate}
                    </p>

                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">

                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Goals
                      </p>

                      <p className="mt-2 text-3xl font-bold text-[#1F3A5F]">
                        {cycle.goalCount}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">

                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Reviews
                      </p>

                      <p className="mt-2 text-3xl font-bold text-[#1F3A5F]">
                        {cycle.reviewCount}
                      </p>

                    </div>

                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">

                    <span className="text-sm font-medium text-slate-500">
                      Click to manage
                    </span>

                    <div className="rounded-full bg-[#1F3A5F]/10 px-4 py-2 text-sm font-semibold text-[#1F3A5F] transition-colors group-hover:bg-[#1F3A5F] group-hover:text-white">
                      View →
                    </div>

                  </div>

                </div>

              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}