import ObservationForm from "../../../src/modules/observations/components/form/ObservationForm";

export default function NewObservationPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EC]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A04E]">
            Student Observations
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0F2147]">
            New Observation
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Select a student and record the observation.
          </p>
        </div>

        <ObservationForm mode="create" />
      </div>
    </main>
  );
}