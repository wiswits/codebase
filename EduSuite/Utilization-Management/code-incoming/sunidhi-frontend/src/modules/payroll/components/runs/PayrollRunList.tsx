// src/modules/payroll/components/runs/PayrollRunList.tsx

"use client";

import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { usePayrollRuns } from "../../hooks/usePayrollRuns";
import { PAYROLL_RUN_STATUS_OPTIONS } from "../../constants/payroll.constants";
import { PayrollRunStatus } from "../../types/payroll.types";
import PayrollRunTable from "./PayrollRunTable";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function PayrollRunList() {
  const router = useRouter();
  const {
    items,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch,
  } = usePayrollRuns();

  const hasActiveFilters = Boolean(filters.search || filters.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Payroll Runs</h1>
          <p className="text-sm text-gray-500">Prepare, review, and track payroll processing.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/hr/payroll/runs/new")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          Prepare Payroll Run
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Search by run reference"
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Status
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as PayrollRunStatus | "" })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {PAYROLL_RUN_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-end text-xs font-medium text-gray-500 hover:text-blue-600"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading && <LoadingState label="Loading payroll runs" />}

        {!loading && error && (
          <ErrorState title="Unable to load payroll runs" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No runs match these filters" : "No payroll runs yet"}
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your search and filters."
                : "Prepare a payroll run to get started."
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <PayrollRunTable items={items} onOpen={(id) => router.push(`/hr/payroll/runs/${id}`)} />
        )}
      </div>
    </div>
  );
}
