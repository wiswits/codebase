import AlumniProfileClient from "@/modules/alumni/components/profile/AlumniProfileClient";

interface AlumniProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AlumniProfilePage({
  params
}: AlumniProfilePageProps) {
  const { id } = await params;

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-gold">
          Alumni Management
        </p>

        <h1 className="page-title">
          Alumni Profile
        </h1>

        <p className="page-description">
          View academic, contact and core information for this alumni record.
        </p>
      </header>

      <AlumniProfileClient alumniId={id} />
    </div>
  );
}