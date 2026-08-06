import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Error 404
        </p>

        <h2 className="mt-3 text-3xl font-bold text-slate-950">
          Page not found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          The page you&apos;re looking for does not exist.
        </p>

        <Link
          href="/registrations"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Return to Registrations
        </Link>
      </div>
    </div>
  );
}