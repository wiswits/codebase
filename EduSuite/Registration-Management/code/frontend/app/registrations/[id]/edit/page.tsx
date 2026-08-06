import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";

import { EditRegistrationForm } from "@/modules/registration/components/form/EditRegistrationForm";

interface EditRegistrationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRegistrationPage({
  params,
}: EditRegistrationPageProps) {
  const { id } = await params;

  const registrationId = Number(id);

  return (
    <div className="space-y-6">
      <Link
        href={`/registrations/${registrationId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#687386] transition-colors hover:text-[#0F2147]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to registration
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8A04E]">
          Registration Management
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F2147]">
          Edit Registration
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687386]">
          Review and update the student,
          guardian and admission information.
        </p>
      </div>

      <EditRegistrationForm
        registrationId={registrationId}
      />
    </div>
  );
}