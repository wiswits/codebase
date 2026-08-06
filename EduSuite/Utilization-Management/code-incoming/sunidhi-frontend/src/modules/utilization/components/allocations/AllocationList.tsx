// src/modules/utilization/components/allocations/AllocationList.tsx
//
// Searchable, filterable allocation list with summary cards and the
// required loading/empty/error states.

"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAllocations } from "../../hooks/useAllocations";
import AllocationSearch from "./AllocationSearch";
import AllocationFilters from "./AllocationFilters";
import AllocationSummary from "./AllocationSummary";
import AllocationTable from "./AllocationTable";
import Pagination from "../common/Pagination";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

export default function AllocationList() {
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
  } = useAllocations();

  const hasActiveFilters = Boolean(filters.search || filters.projectId || filters.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Resource Allocation</h1>
          <p className="text-sm text-gray-500">
            Manage project allocations across employees and projects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/utilization/allocations/new")}
          className="flex items-center gap-2 rounded-lg bg-[#0F2147] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Allocation
        </button>
      </div>

      {!loading && !error && <AllocationSummary allocations={items} />}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <AllocationSearch value={filters.search} onChange={(v) => updateFilters({ search: v })} />
          <AllocationFilters
            filters={{ projectId: filters.projectId ?? "", status: filters.status ?? "" }}
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
        {loading && <LoadingState label="Loading allocations" />}

        {!loading && error && (
          <ErrorState title="Unable to load allocations" message={error} onRetry={refetch} />
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? "No allocations match these filters" : "No allocations found"}
            description={
              hasActiveFilters
                ? "Try adjusting or clearing your search and filters."
                : "New allocations will appear here once created."
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
            <AllocationTable
              items={items}
              onOpen={(id) => router.push(`/utilization/allocations/${id}`)}
            />
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="allocations" />
          </>
        )}
      </div>
    </div>
  );
}
