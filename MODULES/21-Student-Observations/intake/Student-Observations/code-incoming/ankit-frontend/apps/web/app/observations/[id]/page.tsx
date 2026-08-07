"use client";

import { use } from "react";

import ObservationDetail from "../../../src/modules/observations/components/detail/ObservationDetail";
import { useObservation } from "../../../src/modules/observations/hooks/useObservation";

interface ObservationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ObservationPage({
  params,
}: ObservationPageProps) {
  const { id } = use(params);

  const observationId = Number(id);

  const { observation, loading, error, reload } =
    useObservation(observationId);

  return (
    <main className="min-h-screen bg-[#F7F4EC]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading observation...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <h1 className="text-lg font-semibold text-red-700">
              Unable to load observation
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void reload()}
              className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && observation && (
          <ObservationDetail observation={observation} />
        )}
      </div>
    </main>
  );
}