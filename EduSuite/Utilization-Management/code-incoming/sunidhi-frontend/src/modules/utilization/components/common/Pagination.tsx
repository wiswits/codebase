// src/modules/utilization/components/common/Pagination.tsx

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pagination as PaginationType } from "../../types/utilization.types";

interface PaginationProps {
  pagination: PaginationType | null;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export default function Pagination({
  pagination,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  if (!pagination) return null;

  const { page, limit, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}-{end}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-[#0F2147] hover:enabled:text-[#0F2147]"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-[#0F2147] hover:enabled:text-[#0F2147]"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
