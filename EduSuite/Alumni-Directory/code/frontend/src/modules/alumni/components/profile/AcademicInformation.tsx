import {
  BookOpen,
  CalendarCheck,
  GraduationCap
} from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

interface AcademicInformationProps {
  alumni: Alumni;
}

export default function AcademicInformation({
  alumni
}: AcademicInformationProps) {
  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-xl font-bold text-navy">
        Academic Information
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Academic history available in the alumni record.
      </p>

      <div className="mt-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
            <BookOpen size={18} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Course
            </p>

            <p className="mt-1 font-semibold text-navy">
              {alumni.course}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
            <GraduationCap size={18} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Batch
            </p>

            <p className="mt-1 font-semibold text-navy">
              {alumni.batch}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
            <CalendarCheck size={18} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Graduation Year
            </p>

            <p className="mt-1 font-semibold text-navy">
              {alumni.graduationYear}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}