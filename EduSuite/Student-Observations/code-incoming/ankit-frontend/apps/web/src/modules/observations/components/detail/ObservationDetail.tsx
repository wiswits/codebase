"use client";

import { useRouter } from "next/navigation";

import type { Observation } from "../../types/observation.types";

import {
  formatObservationType,
  getStudentInitials,
} from "../../utils/observationFormatters";

import ObservationAuthor from "./ObservationAuthor";
import ObservationMeta from "./ObservationMeta";

interface ObservationDetailProps {
  observation: Observation;
}

export default function ObservationDetail({
  observation,
}: ObservationDetailProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A04E]">
            Student Observation
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0F2147]">
            Observation Detail
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/observations")}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#0F2147] hover:bg-white"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/observations/${observation.id}/edit`
              )
            }
            className="rounded-lg bg-[#0F2147] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Edit Observation
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2147] font-semibold text-white">
                {getStudentInitials(
                  observation.student?.name
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#0F2147]">
                  {observation.student?.name ??
                    "Student information unavailable"}
                </h2>

                {observation.student && (
                  <p className="mt-1 text-sm text-slate-500">
                    {observation.student.studentCode} ·{" "}
                    {observation.student.className}{" "}
                    {observation.student.sectionName}
                  </p>
                )}
              </div>
            </div>

            <span className="w-fit rounded-full bg-[#C8A04E]/15 px-3 py-1.5 text-xs font-bold text-[#0F2147]">
              {formatObservationType(
                observation.observationType
              )}
            </span>
          </div>
        </div>

        <div className="space-y-7 p-6">
          <ObservationMeta observation={observation} />

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Observation
            </h3>

            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F7F4EC] p-5 leading-7 text-slate-700">
              {observation.content}
            </p>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
              Recorded By
            </h3>

            <ObservationAuthor author={observation.author} />
          </section>
        </div>
      </div>
    </div>
  );
}