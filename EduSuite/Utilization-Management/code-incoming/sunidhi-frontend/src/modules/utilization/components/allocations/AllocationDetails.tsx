// src/modules/utilization/components/allocations/AllocationDetails.tsx

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAllocation } from "../../hooks/useAllocation";
import AllocationTimeline from "./AllocationTimeline";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import StatusBadge from "../common/StatusBadge";
import ConfirmDialog from "../common/ConfirmDialog";
import { ALLOCATION_STATUS_BADGE_CLASSES, ALLOCATION_STATUS_LABELS } from "../../constants/utilization.constants";

interface AllocationDetailsProps {
  allocationId: number;
}

export default function AllocationDetails({ allocationId }: AllocationDetailsProps) {
  const { allocation, loading, error, refetch, submitting, submitError, unassign } =
    useAllocation(allocationId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) return <LoadingState rows={3} label="Loading allocation" />;

  if (error) {
    return <ErrorState title="Unable to load this allocation" message={error} onRetry={refetch} />;
  }

  if (!allocation) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{allocation.projectName}</h1>
            <p className="text-sm text-gray-500">
              {allocation.employeeName} &middot; {allocation.employeeCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              label={ALLOCATION_STATUS_LABELS[allocation.status]}
              className={ALLOCATION_STATUS_BADGE_CLASSES[allocation.status]}
            />
            {allocation.status === "active" && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Unassign
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Allocation %
            </p>
            <p className="text-gray-700">{allocation.allocationPercent}%</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Working Hours
            </p>
            <p className="text-gray-700">{allocation.workingHours} hrs/week</p>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <AllocationTimeline allocation={allocation} />
        </div>

        {allocation.remarks && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Remarks</p>
            <p className="mt-1 text-sm text-gray-700">{allocation.remarks}</p>
          </div>
        )}

        {submitError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Unassign this allocation?"
          message={`${allocation.employeeName} will be released from ${allocation.projectName}.`}
          confirmLabel={submitting ? "Unassigning…" : "Unassign"}
          destructive
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await unassign();
            setConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}
