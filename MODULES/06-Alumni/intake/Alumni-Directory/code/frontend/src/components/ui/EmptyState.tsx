import Link from "next/link";

import {
  Users
} from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showDirectoryLink?: boolean;
}

export default function EmptyState({
  title = "No alumni found",
  description =
    "There are no alumni records matching the current selection.",
  showDirectoryLink = false
}: EmptyStateProps) {
  return (
    <div className="surface-card flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ivory text-navy">
        <Users size={25} />
      </div>

      <h3 className="mt-4 font-display text-xl font-bold text-navy">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {showDirectoryLink && (
        <Link
          href="/alumni/directory"
          className="mt-5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c3568]"
        >
          Open Directory
        </Link>
      )}
    </div>
  );
}