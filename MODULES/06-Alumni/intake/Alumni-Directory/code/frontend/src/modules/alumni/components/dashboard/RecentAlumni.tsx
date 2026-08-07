import Link from "next/link";

import {
  ArrowRight
} from "lucide-react";

import {
  ALUMNI_ROUTES
} from "../../constants/alumni.constants";

import {
  getAlumniFullName,
  getInitials
} from "../../utils/alumniFormatters";

import type {
  Alumni
} from "../../types/alumni.types";

interface RecentAlumniProps {
  alumni: Alumni[];
}

export default function RecentAlumni({
  alumni
}: RecentAlumniProps) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="font-display text-xl font-bold text-navy">
            Alumni Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quick access to alumni profiles.
          </p>
        </div>

        <Link
          href={ALUMNI_ROUTES.directory}
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-gold"
        >
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {alumni.slice(0, 5).map(
          (person) => (
            <Link
              key={person.id}
              href={ALUMNI_ROUTES.profile(
                person.id
              )}
              className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                {getInitials(person)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">
                  {getAlumniFullName(
                    person
                  )}
                </p>

                <p className="truncate text-sm text-slate-500">
                  {person.course} ·{" "}
                  {person.graduationYear}
                </p>
              </div>

              <ArrowRight
                size={17}
                className="text-slate-400"
              />
            </Link>
          )
        )}
      </div>
    </section>
  );
}