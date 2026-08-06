// src/modules/payroll/components/adjustments/DeductionsPanel.tsx

"use client";

import { useState } from "react";
import { MinusCircle, Plus } from "lucide-react";
import { useDeductions } from "../../hooks/useDeductions";
import { formatMoney } from "../../constants/payroll.constants";
import { Deduction } from "../../types/payroll.types";
import AddDeductionForm from "./AddDeductionForm";
import AdjustmentDetail from "./AdjustmentDetail";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

interface DeductionsPanelProps {
  runId: number;
}

export default function DeductionsPanel({ runId }: DeductionsPanelProps) {
  const { items, loading, error, submitting, submitError, addDeduction, refetch } =
    useDeductions(runId);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Deduction | null>(null);

  const handleAdd = async (input: Parameters<typeof addDeduction>[0]) => {
    const created = await addDeduction(input);
    if (created) setShowForm(false);
  };

  if (selected) {
    return (
      <AdjustmentDetail kind="deduction" item={selected} onClose={() => setSelected(null)} />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <MinusCircle className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Deductions</h2>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Deduction
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-4">
          <AddDeductionForm
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading && <LoadingState rows={2} label="Loading deductions" />}

      {!loading && error && (
        <ErrorState title="Unable to load deductions" message={error} onRetry={refetch} />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="No deductions recorded for this run" />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="divide-y divide-gray-50">
          {items.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">{d.deductionTitle}</p>
                <p className="text-xs text-gray-500">
                  {d.employeeName} &middot; {d.reason}
                </p>
              </div>
              <span className="font-medium text-gray-800">₹{formatMoney(d.amount)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
