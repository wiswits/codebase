"use client";

import Link from "next/link";

import {
  ArrowRight,
  Users
} from "lucide-react";

import AlumniStats from "./AlumniStats";
import BatchOverview from "./BatchOverview";
import RecentAlumni from "./RecentAlumni";

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

import {
  useAlumni
} from "../../hooks/useAlumni";

import {
  useAlumniStats
} from "../../hooks/useAlumniStats";

import {
  ALUMNI_ROUTES
} from "../../constants/alumni.constants";

export default function AlumniDashboardClient() {
  const {
    items,
    loading: alumniLoading,
    error: alumniError,
    refresh: refreshAlumni
  } = useAlumni({
    page: 1,
    limit: 5
  });

  const {
    stats,
    batches,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats
  } = useAlumniStats();

  if (
    alumniLoading ||
    statsLoading
  ) {
    return (
      <LoadingState message="Loading alumni dashboard..." />
    );
  }

  if (alumniError) {
    return (
      <ErrorState
        message={alumniError}
        onRetry={refreshAlumni}
      />
    );
  }

  if (statsError || !stats) {
    return (
      <ErrorState
        message={
          statsError ??
          "Statistics are unavailable."
        }
        onRetry={refreshStats}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AlumniStats stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <RecentAlumni alumni={items} />

        <BatchOverview batches={batches} />
      </div>

      <section className="rounded-2xl bg-navy p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <Users size={19} />

              <span className="text-sm font-bold uppercase tracking-wider">
                Directory
              </span>
            </div>

            <h2 className="mt-3 font-display text-2xl font-bold">
              Explore the alumni community
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Search alumni by name, batch,
              graduation year and course.
            </p>
          </div>

          <Link
            href={ALUMNI_ROUTES.directory}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy transition hover:brightness-105"
          >
            Open Directory
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}