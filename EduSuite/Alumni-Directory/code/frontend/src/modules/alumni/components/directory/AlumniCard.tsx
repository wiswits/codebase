import Link from "next/link";

import {
  ArrowRight,
  GraduationCap,
  Mail,
  Phone
} from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

import {
  getAlumniFullName,
  getInitials
} from "../../utils/alumniFormatters";

import { ALUMNI_ROUTES } from "../../constants/alumni.constants";

interface AlumniCardProps {
  alumni: Alumni;
}

export default function AlumniCard({
  alumni
}: AlumniCardProps) {
  return (
    <article className="surface-card overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="h-1 bg-gold" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white">
            {getInitials(alumni)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold text-navy">
              {getAlumniFullName(alumni)}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {alumni.course}
            </p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              alumni.status === "active"
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {alumni.status}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <GraduationCap
              size={17}
              className="text-gold"
            />

            <span>
              {alumni.batch} · {alumni.graduationYear}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Mail
              size={17}
              className="text-gold"
            />

            <span className="truncate">
              {alumni.email || "No email available"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Phone
              size={17}
              className="text-gold"
            />

            <span>
              {alumni.phone || "No phone available"}
            </span>
          </div>
        </div>

        <Link
          href={ALUMNI_ROUTES.profile(alumni.id)}
          className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-navy transition hover:text-gold"
        >
          View profile
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}