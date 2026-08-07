"use client";

import { use } from "react";

import ObservationForm from "../../../../src/modules/observations/components/form/ObservationForm";
import { useObservation } from "../../../../src/modules/observations/hooks/useObservation";

interface EditObservationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditObservationPage({
  params,
}: EditObservationPageProps) {
  const { id } = use(params);

  const observationId = Number(id);

  const { observation, loading, error, reload } =
    useObservation(observationId);

  return (
    <main className="min-h-screen bg-[#F7F4EC]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A04E]">
            Student Observations
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0F2147]">
            Edit Observation
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the permitted observation information.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading observation...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
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

        {!loading && !error && observation && (
          <ObservationForm
            mode="edit"
            observation={observation}
          />
        )}
      </div>
    </main>
  );
}