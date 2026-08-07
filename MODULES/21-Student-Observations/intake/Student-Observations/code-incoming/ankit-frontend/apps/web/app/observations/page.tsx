import ObservationOverview from "../../src/modules/observations/components/dashboard/ObservationOverview";

export default function ObservationsPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ObservationOverview />
      </div>
    </main>
  );
}