"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useObservations } from "../../hooks/useObservation";

import type { ObservationType } from "../../types/observation.types";

import {
  formatObservationDate,
  formatObservationType,
  getStudentInitials,
} from "../../utils/observationFormatters";

export default function ObservationOverview() {
  const router = useRouter();

  const { observations, loading, error, reload } =
    useObservations();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<ObservationType | "all">(
    "all"
  );

  const filteredObservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return observations.filter((observation) => {
      const matchesType =
        type === "all" ||
        observation.observationType === type;

      const matchesSearch =
        !query ||
        observation.student?.name
          .toLowerCase()
          .includes(query) ||
        observation.student?.studentCode
          .toLowerCase()
          .includes(query) ||
        observation.content.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [observations, search, type]);

  const anecdotalCount = observations.filter(
    (item) => item.observationType === "anecdotal"
  ).length;

  const classSchoolCount = observations.filter(
    (item) => item.observationType === "class_school"
  ).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A04E]">
            Student Life
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0F2147]">
            Student Observations
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record and review anecdotal and class/school
            observations for students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/observations/new")}
          className="rounded-lg bg-[#0F2147] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + New Observation
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Observations"
          value={observations.length}
        />

        <StatCard
          label="Anecdotal"
          value={anecdotalCount}
        />

        <StatCard
          label="Class / School"
          value={classSchoolCount}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student, ID or observation..."
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-[#0F2147] outline-none focus:border-[#C8A04E] focus:ring-2 focus:ring-[#C8A04E]/20"
          />

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value as ObservationType | "all"
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-[#0F2147] outline-none focus:border-[#C8A04E]"
          >
            <option value="all">All observation types</option>
            <option value="anecdotal">Anecdotal</option>
            <option value="class_school">
              Class / School
            </option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading observations...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void reload()}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        filteredObservations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="font-semibold text-[#0F2147]">
              No observations found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create a new student
              observation.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        filteredObservations.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[2fr_1fr_1.4fr_100px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
              <span>Student</span>
              <span>Type</span>
              <span>Recorded</span>
              <span>Action</span>
            </div>

            {filteredObservations.map((observation) => (
              <button
                key={observation.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/observations/${observation.id}`
                  )
                }
                className="grid w-full gap-4 border-b border-slate-100 px-6 py-5 text-left transition last:border-b-0 hover:bg-slate-50 md:grid-cols-[2fr_1fr_1.4fr_100px] md:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F2147] text-xs font-bold text-white">
                    {getStudentInitials(
                      observation.student?.name
                    )}
                  </span>

                  <span>
                    <span className="block font-semibold text-[#0F2147]">
                      {observation.student?.name ??
                        "Unknown student"}
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-400">
                      {observation.student?.studentCode ??
                        "No student ID"}
                    </span>
                  </span>
                </div>

                <span className="text-sm text-slate-600">
                  {formatObservationType(
                    observation.observationType
                  )}
                </span>

                <span className="text-sm text-slate-500">
                  {formatObservationDate(
                    observation.createdAt
                  )}
                </span>

                <span className="text-sm font-semibold text-[#0F2147]">
                  View →
                </span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-[#0F2147]">
        {value}
      </p>
    </div>
  );
}