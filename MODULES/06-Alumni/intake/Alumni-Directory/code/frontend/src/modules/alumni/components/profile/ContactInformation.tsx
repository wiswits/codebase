import {
  Mail,
  Phone
} from "lucide-react";

import type { Alumni } from "../../types/alumni.types";

import {
  displayValue
} from "../../utils/alumniFormatters";

interface ContactInformationProps {
  alumni: Alumni;
}

export default function ContactInformation({
  alumni
}: ContactInformationProps) {
  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-xl font-bold text-navy">
        Contact Information
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Contact details associated with this alumni profile.
      </p>

      <div className="mt-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
            <Mail size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </p>

            {alumni.email ? (
              <a
                href={`mailto:${alumni.email}`}
                className="mt-1 block break-all font-semibold text-navy transition hover:text-gold"
              >
                {alumni.email}
              </a>
            ) : (
              <p className="mt-1 font-semibold text-navy">
                {displayValue(alumni.email)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory text-navy">
            <Phone size={18} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phone Number
            </p>

            {alumni.phone ? (
              <a
                href={`tel:${alumni.phone}`}
                className="mt-1 block font-semibold text-navy transition hover:text-gold"
              >
                {alumni.phone}
              </a>
            ) : (
              <p className="mt-1 font-semibold text-navy">
                {displayValue(alumni.phone)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}