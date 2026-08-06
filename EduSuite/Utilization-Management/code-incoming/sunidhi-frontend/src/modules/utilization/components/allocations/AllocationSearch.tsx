// src/modules/utilization/components/allocations/AllocationSearch.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface AllocationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AllocationSearch({ value, onChange }: AllocationSearchProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 350);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Search by employee or project"
        aria-label="Search allocations"
        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
