"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Grid2X2,
  List
} from "lucide-react";

import AlumniSearch from "./AlumniSearch";
import AlumniFilters from "./AlumniFilters";
import AlumniCard from "./AlumniCard";
import AlumniTable from "./AlumniTable";
import AlumniPagination from "./AlumniPagination";

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

import { useAlumni } from "../../hooks/useAlumni";
import { useAlumniStats } from "../../hooks/useAlumniStats";

import {
  DEFAULT_LIMIT
} from "../../constants/alumni.constants";

type ViewMode = "table" | "grid";

export default function AlumniDirectoryClient() {
  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [batch, setBatch] =
    useState("");

  const [graduationYear, setGraduationYear] =
    useState("");

  const [course, setCourse] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  // Debounce search so every keystroke does not hit the API.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      search: search || undefined,
      batch: batch || undefined,

      graduationYear:
        graduationYear
          ? Number(graduationYear)
          : undefined,

      course: course || undefined,
      page,
      limit: DEFAULT_LIMIT
    }),
    [
      search,
      batch,
      graduationYear,
      course,
      page
    ]
  );

  const {
    items,
    pagination,
    loading,
    error,
    refresh
  } = useAlumni(query);

  const {
    stats,
    batches: batchStats
  } = useAlumniStats();

  const batchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          batchStats
            .map((item) => item.batch)
            .filter(Boolean)
        )
      ).sort(),
    [batchStats]
  );

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          batchStats.map(
            (item) =>
              item.graduationYear
          )
        )
      )
        .filter(Boolean)
        .sort((a, b) => b - a),
    [batchStats]
  );

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          stats?.byCourse
            .map((item) => item.course)
            .filter(Boolean) ?? []
        )
      ).sort(),
    [stats]
  );

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setBatch("");
    setGraduationYear("");
    setCourse("");
    setPage(1);
  }

  function changeBatch(value: string) {
    setBatch(value);
    setPage(1);
  }

  function changeYear(value: string) {
    setGraduationYear(value);
    setPage(1);
  }

  function changeCourse(value: string) {
    setCourse(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="surface-card p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <AlumniSearch
            value={searchInput}
            onChange={setSearchInput}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMode("table")
              }
              aria-label="Table view"
              aria-pressed={
                viewMode === "table"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                viewMode === "table"
                  ? "border-navy bg-navy text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-gold hover:text-navy"
              }`}
            >
              <List size={18} />
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode("grid")
              }
              aria-label="Grid view"
              aria-pressed={
                viewMode === "grid"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                viewMode === "grid"
                  ? "border-navy bg-navy text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-gold hover:text-navy"
              }`}
            >
              <Grid2X2 size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <AlumniFilters
            batch={batch}
            graduationYear={graduationYear}
            course={course}
            batches={batchOptions}
            years={yearOptions}
            courses={courseOptions}
            onBatchChange={changeBatch}
            onYearChange={changeYear}
            onCourseChange={changeCourse}
            onReset={resetFilters}
          />
        </div>
      </section>

      {loading ? (
        <LoadingState message="Loading alumni directory..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={refresh}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No matching alumni"
          description="No alumni records matched your current search and filters. Try changing or resetting them."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-navy">
                {pagination.total} alumni found
              </p>

              <p className="text-sm text-slate-500">
                Showing page {pagination.page} of{" "}
                {Math.max(
                  pagination.totalPages,
                  1
                )}
              </p>
            </div>
          </div>

          {viewMode === "table" ? (
            <AlumniTable
              alumni={items}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {items.map((person) => (
                <AlumniCard
                  key={person.id}
                  alumni={person}
                />
              ))}
            </div>
          )}

          <AlumniPagination
            pagination={pagination}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}