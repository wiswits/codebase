// src/modules/utilization/components/reports/TeamReport.tsx
//
// Preset report view: utilization grouped by team, weekly period.

"use client";

import { useReports } from "../../hooks/useReports";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportExport from "./ReportExport";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function TeamReport() {
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
  } = useReports("team", "weekly");

  const hasActiveFilters = Boolean(filters.search);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Team Report</h2>
          <p className="text-sm text-gray-500">Weekly utilization for each team.</p>
        </div>
        <ReportExport items={items} fileName="team-utilization-report" />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <ReportFilters
          filters={{ search: filters.search, departmentId: "" }}
          onChange={updateFilters}
          showDepartmentFilter={false}
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
        {loading && <LoadingState label="Loading team report" />}
        {!loading && error && (
          <ErrorState title="Unable to load this report" message={error} onRetry={refetch} />
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="No data for this report" description="Try adjusting your filters." />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ReportTable items={items} groupLabelHeader="Team" />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="teams" />
          </>
        )}
      </div>
    </div>
  );
}
