import Link from "next/link";

import {
  ArrowLeft,
  GraduationCap
} from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

import {
  getAlumniFullName,
  getInitials
} from "../../utils/alumniFormatters";

import {
  ALUMNI_ROUTES
} from "../../constants/alumni.constants";

interface ProfileHeaderProps {
  alumni: Alumni;
}

export default function ProfileHeader({
  alumni
}: ProfileHeaderProps) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="h-2 bg-gold" />

      <div className="p-6 md:p-8">
        <Link
          href={ALUMNI_ROUTES.directory}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-navy"
        >
          <ArrowLeft size={17} />
          Back to Directory
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-navy font-display text-3xl font-bold text-white shadow-lg">
            {getInitials(alumni)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-navy md:text-4xl">
                {getAlumniFullName(alumni)}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  alumni.status === "active"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {alumni.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <GraduationCap
                  size={17}
                  className="text-gold"
                />

                {alumni.course}
              </span>

              <span>
                Batch {alumni.batch}
              </span>

              <span>
                Class of {alumni.graduationYear}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}