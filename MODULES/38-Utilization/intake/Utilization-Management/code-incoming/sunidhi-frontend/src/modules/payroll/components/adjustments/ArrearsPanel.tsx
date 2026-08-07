// src/modules/payroll/components/adjustments/ArrearsPanel.tsx

"use client";

import { useState } from "react";
import { PlusCircle, Plus } from "lucide-react";
import { useArrears } from "../../hooks/useArrears";
import { formatMoney } from "../../constants/payroll.constants";
import { Arrear } from "../../types/payroll.types";
import AddArrearForm from "./AddArrearForm";
import AdjustmentDetail from "./AdjustmentDetail";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

interface ArrearsPanelProps {
  runId: number;
}

export default function ArrearsPanel({ runId }: ArrearsPanelProps) {
  const { items, loading, error, submitting, submitError, addArrear, refetch } =
    useArrears(runId);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Arrear | null>(null);

  const handleAdd = async (input: Parameters<typeof addArrear>[0]) => {
    const created = await addArrear(input);
    if (created) setShowForm(false);
  };

  if (selected) {
    return <AdjustmentDetail kind="arrear" item={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Arrears</h2>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Arrear
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-4">
          <AddArrearForm
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading && <LoadingState rows={2} label="Loading arrears" />}

      {!loading && error && (
        <ErrorState title="Unable to load arrears" message={error} onRetry={refetch} />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="No arrears recorded for this run" />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="divide-y divide-gray-50">
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">{a.arrearTitle}</p>
                <p className="text-xs text-gray-500">
                  {a.employeeName} &middot; {a.reason}
                </p>
              </div>
              <span className="font-medium text-gray-800">₹{formatMoney(a.amount)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
