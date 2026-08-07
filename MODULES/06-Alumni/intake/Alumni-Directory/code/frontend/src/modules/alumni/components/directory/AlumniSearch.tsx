"use client";

import { Search, X } from "lucide-react";

interface AlumniSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AlumniSearch({
  value,
  onChange
}: AlumniSearchProps) {
  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="search"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Search alumni by name..."
        aria-label="Search alumni"
        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/20"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}