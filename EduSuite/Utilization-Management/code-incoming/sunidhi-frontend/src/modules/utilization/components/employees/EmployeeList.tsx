// src/modules/utilization/components/employees/EmployeeList.tsx
//
// Searchable, filterable employee list with the required loading/
// empty/error states (shared components from components/common/).

"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useEmployees } from "../../hooks/useEmployees";
import EmployeeSearch from "./EmployeeSearch";
import EmployeeFilters from "./EmployeeFilters";
import EmployeeTable from "./EmployeeTable";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function EmployeeList() {
  const router = useRouter();
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
  } = useEmployees();

  const hasActiveFilters = Boolean(
    filters.search || filters.departmentId || filters.employmentStatus || filters.onBench !== ""
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Employee Utilization</h1>
          <p className="text-sm text-gray-500">
            Track capacity, allocation, and utilization across all employees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/utilization/employees/new")}
          className="flex items-center gap-2 rounded-lg bg-[#0F2147] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <EmployeeSearch value={filters.search} onChange={(v) => updateFilters({ search: v })} />
          <EmployeeFilters
            filters={{
              departmentId: filters.departmentId ?? "",
              employmentStatus: filters.employmentStatus ?? "",
              onBench: filters.onBench ?? "",
            }}
            onChange={updateFilters}
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
        {loading && <LoadingState label="Loading employees" />}

        {!loading && error && (
          <ErrorState title="Unable to load employees" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No employees match these filters" : "No employees found"}
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your search and filters."
                : "Employees will appear here once added."
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-[#0F2147] px-4 py-2 text-sm font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <EmployeeTable
              items={items}
              onOpen={(id) => router.push(`/utilization/employees/${id}`)}
            />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="employees" />
          </>
        )}
      </div>
    </div>
  );
}
