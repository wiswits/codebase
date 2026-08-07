import {
  BadgeCheck,
  CalendarDays,
  Hash,
  User
} from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

import {
  displayValue,
  getAlumniFullName
} from "../../utils/alumniFormatters";

interface BasicInformationProps {
  alumni: Alumni;
}

export default function BasicInformation({
  alumni
}: BasicInformationProps) {
  const items = [
    {
      label: "Full Name",
      value: getAlumniFullName(alumni),
      icon: User
    },
    {
      label: "Alumni ID",
      value: alumni.id,
      icon: Hash
    },
    {
      label: "Graduation Year",
      value: alumni.graduationYear,
      icon: CalendarDays
    },
    {
      label: "Status",
      value: alumni.status,
      icon: BadgeCheck
    }
  ];

  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-xl font-bold text-navy">
        Basic Information
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Core alumni record information.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-start gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
                <Icon size={18} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 font-semibold capitalize text-navy">
                  {displayValue(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}