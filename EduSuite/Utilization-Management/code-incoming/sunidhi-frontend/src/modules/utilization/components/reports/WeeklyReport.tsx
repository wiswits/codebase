// src/modules/utilization/components/reports/WeeklyReport.tsx
//
// Preset report view: weekly utilization, grouped by employee by
// default with the option to switch grouping.

"use client";

import { useState } from "react";
import { useReports } from "../../hooks/useReports";
import { REPORT_GROUP_BY_OPTIONS } from "../../constants/utilization.constants";
import { ReportGroupBy } from "../../types/utilization.types";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportExport from "./ReportExport";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

const HEADER_BY_GROUP: Record<ReportGroupBy, string> = {
  employee: "Employee",
  department: "Department",
  team: "Team",
};

export default function WeeklyReport() {
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("employee");
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
  } = useReports(groupBy, "weekly");

  const hasActiveFilters = Boolean(filters.search || filters.departmentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Weekly Report</h2>
          <p className="text-sm text-gray-500">Utilization for the current week.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
          >
            {REPORT_GROUP_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ReportExport items={items} fileName="weekly-utilization-report" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <ReportFilters
          filters={{ search: filters.search, departmentId: filters.departmentId ?? "" }}
          onChange={updateFilters}
          showDepartmentFilter={groupBy !== "team"}
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
        {loading && <LoadingState label="Loading weekly report" />}
        {!loading && error && (
          <ErrorState title="Unable to load this report" message={error} onRetry={refetch} />
        )}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="No data for this report" description="Try adjusting your filters." />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ReportTable items={items} groupLabelHeader={HEADER_BY_GROUP[groupBy]} />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="rows" />
          </>
        )}
      </div>
    </div>
  );
}
