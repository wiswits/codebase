// src/modules/utilization/components/reports/EmployeeReport.tsx
//
// Preset report view: utilization grouped by employee, monthly period.

"use client";

import { useReports } from "../../hooks/useReports";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportExport from "./ReportExport";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function EmployeeReport() {
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
  } = useReports("employee", "monthly");

  const hasActiveFilters = Boolean(filters.search || filters.departmentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Employee Report</h2>
          <p className="text-sm text-gray-500">Monthly utilization for each employee.</p>
        </div>
        <ReportExport items={items} fileName="employee-utilization-report" />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <ReportFilters
          filters={{ search: filters.search, departmentId: filters.departmentId ?? "" }}
          onChange={updateFilters}
        />
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
        {loading && <LoadingState label="Loading employee report" />}
        {!loading && error && (
          <ErrorState title="Unable to load this report" message={error} onRetry={refetch} />
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="No data for this report" description="Try adjusting your filters." />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ReportTable items={items} groupLabelHeader="Employee" />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="employees" />
          </>
        )}
      </div>
    </div>
  );
}
