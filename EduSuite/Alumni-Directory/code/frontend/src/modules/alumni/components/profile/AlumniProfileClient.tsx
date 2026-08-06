"use client";

import {
  RefreshCw
} from "lucide-react";

import ProfileHeader from "./ProfileHeader";
import BasicInformation from "./BasicInformation";
import AcademicInformation from "./AcademicInformation";
import ContactInformation from "./ContactInformation";

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

import {
  useAlumniProfile
} from "../../hooks/useAlumniProfile";

interface AlumniProfileClientProps {
  alumniId: string;
}

export default function AlumniProfileClient({
  alumniId
}: AlumniProfileClientProps) {
  const {
    alumni,
    loading,
    error,
    refresh
  } = useAlumniProfile(alumniId);

  if (loading) {
    return (
      <LoadingState message="Loading alumni profile..." />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={refresh}
      />
    );
  }

  if (!alumni) {
    return (
      <ErrorState
        message="The requested alumni profile could not be found."
        onRetry={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader alumni={alumni} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BasicInformation alumni={alumni} />

        <AcademicInformation alumni={alumni} />
      </div>

      <ContactInformation alumni={alumni} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold"
        >
          <RefreshCw size={16} />
          Refresh Profile
        </button>
      </div>
    </div>
  );
}