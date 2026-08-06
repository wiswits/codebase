import type {
  AlumniBatch
} from "../../types/alumni.types";

interface BatchOverviewProps {
  batches: AlumniBatch[];
}

export default function BatchOverview({
  batches
}: BatchOverviewProps) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-display text-xl font-bold text-navy">
          Batch Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Alumni distribution across graduating batches.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {batches.slice(0, 6).map(
          (batch, index) => (
            <div
              key={`${batch.batch}-${batch.graduationYear}-${index}`}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-semibold text-navy">
                  {batch.batch}
                </p>

                <p className="text-xs text-slate-500">
                  Graduation year{" "}
                  {batch.graduationYear}
                </p>
              </div>

              <div className="rounded-full bg-ivory px-3 py-1 text-sm font-bold text-navy">
                {batch.total}
              </div>
            </div>
          )
        )}

        {batches.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No batch information available.
          </div>
        )}
      </div>
    </section>
  );
}