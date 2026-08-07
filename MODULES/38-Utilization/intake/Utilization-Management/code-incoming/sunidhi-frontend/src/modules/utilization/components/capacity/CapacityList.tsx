// src/modules/utilization/components/capacity/CapacityList.tsx
//
// Searchable, period-filterable capacity list with a chart, summary
// cards, and the required loading/empty/error states.

"use client";

import { useMemo, useState } from "react";
import { useCapacity } from "../../hooks/useCapacity";
import { MOCK_EMPLOYEES } from "../../mocks/utilization.mock";
import CapacityFilters from "./CapacityFilters";
import CapacitySummary from "./CapacitySummary";
import CapacityChart from "./CapacityChart";
import CapacityTable from "./CapacityTable";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";
import { AlertCircle } from "lucide-react";
import { CapacityPlanInput } from "../../types/utilization.types";

const emptyPlanForm: CapacityPlanInput = {
  employeeId: 0,
  period: "",
  weeklyCapacityHours: 40,
  monthlyCapacityHours: 160,
};

export default function CapacityList() {
  const {
    items,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    setPage,
    refetch,
    submitting,
    submitError,
    savePlan,
  } = useCapacity();

  const [planForm, setPlanForm] = useState<CapacityPlanInput>(emptyPlanForm);
  const [formOpen, setFormOpen] = useState(false);

  const periodOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.period))).sort(),
    [items]
  );

  const hasActiveFilters = Boolean(filters.search || filters.period);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await savePlan(planForm);
    if (saved) {
      setFormOpen(false);
      setPlanForm(emptyPlanForm);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Capacity Planning</h1>
          <p className="text-sm text-gray-500">
            Track weekly and monthly capacity against allocated hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="rounded-lg bg-[#0F2147] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          {formOpen ? "Close" : "Add / Update Plan"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Employee
            <select
              value={planForm.employeeId || ""}
              onChange={(e) => setPlanForm((p) => ({ ...p, employeeId: Number(e.target.value) }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            >
              <option value="">Select an employee</option>
              {MOCK_EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Period
            <input
              type="month"
              value={planForm.period ? `${planForm.period}` : ""}
              onChange={(e) => setPlanForm((p) => ({ ...p, period: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Weekly Capacity (hrs)
            <input
              type="number"
              min={1}
              value={planForm.weeklyCapacityHours}
              onChange={(e) =>
                setPlanForm((p) => ({ ...p, weeklyCapacityHours: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Monthly Capacity (hrs)
            <input
              type="number"
              min={1}
              value={planForm.monthlyCapacityHours}
              onChange={(e) =>
                setPlanForm((p) => ({ ...p, monthlyCapacityHours: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={submitting || !planForm.employeeId || !planForm.period}
              className="rounded-lg bg-[#0F2147] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
            >
              {submitting ? "Saving…" : "Save Plan"}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && (
        <>
          <CapacitySummary plans={items} />
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Allocated vs. Capacity</h3>
            <CapacityChart plans={items} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-gray-500 sm:max-w-xs">
            Search
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search by employee"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
            />
          </label>
          <CapacityFilters
            filters={{ period: filters.period ?? "" }}
            onChange={updateFilters}
            periodOptions={periodOptions}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-end text-xs font-medium text-gray-500 hover:text-[#0F2147]"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading && <LoadingState label="Loading capacity plans" />}

        {!loading && error && (
          <ErrorState title="Unable to load capacity plans" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No capacity plans match these filters" : "No capacity plans found"}
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your search and filters."
                : "Add a plan above to get started."
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <CapacityTable items={items} />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="plans" />
          </>
        )}
      </div>
    </div>
  );
}
