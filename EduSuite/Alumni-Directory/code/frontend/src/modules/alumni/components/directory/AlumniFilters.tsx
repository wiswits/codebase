"use client";

import { RotateCcw } from "lucide-react";

interface AlumniFiltersProps {
  batch: string;
  graduationYear: string;
  course: string;

  batches: string[];
  years: number[];
  courses: string[];

  onBatchChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onReset: () => void;
}

export default function AlumniFilters({
  batch,
  graduationYear,
  course,
  batches,
  years,
  courses,
  onBatchChange,
  onYearChange,
  onCourseChange,
  onReset
}: AlumniFiltersProps) {
  const selectClass =
    "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={batch}
        onChange={(event) =>
          onBatchChange(event.target.value)
        }
        className={selectClass}
        aria-label="Filter by batch"
      >
        <option value="">All batches</option>

        {batches.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={graduationYear}
        onChange={(event) =>
          onYearChange(event.target.value)
        }
        className={selectClass}
        aria-label="Filter by graduation year"
      >
        <option value="">All years</option>

        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        value={course}
        onChange={(event) =>
          onCourseChange(event.target.value)
        }
        className={selectClass}
        aria-label="Filter by course"
      >
        <option value="">All courses</option>

        {courses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-gold hover:text-navy"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}