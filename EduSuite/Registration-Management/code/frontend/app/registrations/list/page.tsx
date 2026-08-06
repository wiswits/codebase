"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

import { RegistrationList } from "@/modules/registration/components/list/RegistrationList";
import { useRegistrations } from "@/modules/registration/hooks/useRegistrations";

export default function RegistrationListPage() {
  const {
    registrations,
    loading,
    error,
    refresh,
  } = useRegistrations();

  if (loading) {
    return (
      <LoadingState message="Loading registrations..." />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[#687386]">
            Admissions workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0F2147]">
            Student Registrations
          </h1>

          <p className="mt-2 text-sm text-[#687386]">
            View, search and manage all student
            registration records.
          </p>
        </div>

        <Link href="/registrations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Registration
          </Button>
        </Link>
      </div>

      <RegistrationList
        registrations={registrations}
      />
    </div>
  );
}