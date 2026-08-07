import Link from "next/link";

import { ArrowRight } from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

import {
  getAlumniFullName,
  getInitials
} from "../../utils/alumniFormatters";

import { ALUMNI_ROUTES } from "../../constants/alumni.constants";

interface AlumniTableProps {
  alumni: Alumni[];
}

export default function AlumniTable({
  alumni
}: AlumniTableProps) {
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Alumni
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Batch
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Year
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Course
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </th>

            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {alumni.map((person) => (
            <tr
              key={person.id}
              className="transition hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    {getInitials(person)}
                  </div>

                  <div>
                    <p className="font-semibold text-navy">
                      {getAlumniFullName(person)}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {person.email || "No email"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {person.batch}
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {person.graduationYear}
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {person.course}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    person.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {person.status}
                </span>
              </td>

              <td className="px-5 py-4 text-right">
                <Link
                  href={ALUMNI_ROUTES.profile(person.id)}
                  aria-label={`View ${getAlumniFullName(person)}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-ivory hover:text-navy"
                >
                  <ArrowRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}