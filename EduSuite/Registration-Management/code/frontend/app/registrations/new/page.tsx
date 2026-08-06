import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RegistrationForm } from "@/modules/registration/components/form/RegistrationForm";

export default function NewRegistrationPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/registrations"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to registrations
      </Link>

      <div>
        <p className="text-sm font-medium text-slate-500">
          Admissions workspace
        </p>

        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          New Registration
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Create a new student registration record.
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
}