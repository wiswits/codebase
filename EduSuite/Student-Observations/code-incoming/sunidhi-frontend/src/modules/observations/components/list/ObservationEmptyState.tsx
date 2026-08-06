// src/modules/observations/components/list/ObservationEmptyState.tsx

import { NotebookPen } from "lucide-react";

interface ObservationEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function ObservationEmptyState({
  hasActiveFilters,
  onClearFilters,
}: ObservationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F4EC]">
        <NotebookPen className="h-7 w-7 text-[#0F2147]" />
      </div>
      <h3 className="text-base font-semibold text-gray-800">
        {hasActiveFilters
          ? "No observations match these filters"
          : "No observations recorded yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasActiveFilters
          ? "Try adjusting or clearing your search and filters."
          : "Once observations are recorded, they'll show up here."}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-[8px] border border-[#0F2147] px-4 py-2 text-sm font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
