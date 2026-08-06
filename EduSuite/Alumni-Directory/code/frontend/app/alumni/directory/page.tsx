import AlumniDirectoryClient from "@/modules/alumni/components/directory/AlumniDirectoryClient";

export default function AlumniDirectoryPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-gold">
          Alumni Management
        </p>

        <h1 className="page-title">
          Alumni Directory
        </h1>

        <p className="page-description">
          Search and filter alumni by name,
          batch, graduation year and course,
          then open a profile for complete
          information.
        </p>
      </header>

      <AlumniDirectoryClient />
    </div>
  );
}