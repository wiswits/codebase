// src/modules/observations/components/list/ObservationList.tsx
//
// Sunidhi's scope (Contract Section 17): the observation browsing/list
// experience — search, filters, card list, pagination, and the
// required loading/empty/error/retry states.
//
// This component is rendered by the App Router page at
// app/.../observations/page.tsx (route wiring is not Sunidhi's file —
// see Section 16/17). It only needs an onOpenObservation callback so
// the host page can navigate to Ankit's detail route.

"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useObservations } from "../../hooks/useObservations";
import ObservationSearch from "./ObservationSearch";
import ObservationFilters from "./ObservationFilters";
import ObservationCard from "./ObservationCard";
import ObservationPagination from "./ObservationPagination";
import ObservationLoadingState from "./ObservationLoadingState";
import ObservationEmptyState from "./ObservationEmptyState";

interface ObservationListProps {
  onOpenObservation: (id: number) => void;
}

export default function ObservationList({
  onOpenObservation,
}: ObservationListProps) {
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
  } = useObservations();

  const hasActiveFilters = Boolean(filters.search || filters.observationType);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-semibold text-[#0F2147]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Student Observations
        </h1>
        <p className="text-sm text-gray-500">
          Browse recorded anecdotal and class/school observations.
        </p>
      </div>

      {/* Toolbar: search + type filter */}
      <div className="flex flex-col gap-3 rounded-[8px] border border-gray-100 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <ObservationSearch
            value={filters.search}
            onChange={(v) => updateFilters({ search: v })}
          />
          <ObservationFilters
            observationType={filters.observationType ?? ""}
            onChange={(v) => updateFilters({ observationType: v })}
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

      {/* Body: loading / error / empty / data */}
      <div className="rounded-[8px] border border-gray-100 bg-white">
        {loading && (
          <div className="p-4">
            <ObservationLoadingState />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-gray-700">
              Couldn&apos;t load observations
            </p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="flex items-center gap-2 rounded-[8px] border border-[#0F2147] px-4 py-2 text-sm font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-4">
            <ObservationEmptyState
              hasActiveFilters={hasActiveFilters}
              onClearFilters={resetFilters}
            />
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              {items.map((observation) => (
                <ObservationCard
                  key={observation.id}
                  observation={observation}
                  onOpen={onOpenObservation}
                />
              ))}
            </div>
            <ObservationPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
