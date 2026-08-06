import AlumniDashboardClient from "@/modules/alumni/components/dashboard/AlumniDashboardClient";

export default function AlumniDashboardPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-gold">
          Alumni Management
        </p>

        <h1 className="page-title">
          Alumni Dashboard
        </h1>

        <p className="page-description">
          View alumni statistics, batch
          distribution and recent alumni
          records from the connected EduSuite
          database.
        </p>
      </header>

      <AlumniDashboardClient />
    </div>
  );
}