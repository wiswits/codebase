"use client";

import {
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import type { Pagination } from "../../types/alumni.types";

interface AlumniPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export default function AlumniPagination({
  pagination,
  onPageChange
}: AlumniPaginationProps) {
  const {
    page,
    totalPages,
    total
  } = pagination;

  if (totalPages <= 1) {
    return total > 0 ? (
      <p className="text-sm text-slate-500">
        {total} alumni record{total === 1 ? "" : "s"}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {total} records
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-navy px-3 text-sm font-bold text-white">
          {page}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}