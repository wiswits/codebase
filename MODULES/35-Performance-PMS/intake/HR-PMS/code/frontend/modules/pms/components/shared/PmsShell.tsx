"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PMS_ROUTES } from "../../constants";
import { MOCK_CURRENT_USERS } from "../../mocks/seed-data";
import { usePmsUser } from "../../context/pms-user-context";

const NAV_ITEMS = [
  { href: PMS_ROUTES.root, label: "Overview" },
  { href: PMS_ROUTES.cycles, label: "Appraisal Cycles" },
  { href: PMS_ROUTES.goals, label: "Goals" },
  { href: PMS_ROUTES.selfReview, label: "Self Review" },
  { href: PMS_ROUTES.reviews, label: "Reviewer Form" },
  { href: PMS_ROUTES.summary, label: "Rating Summary" },
];

export function PmsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, mockRole, setMockRole } = usePmsUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1F3A5F]">
              WisWits · hr_pms
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Performance Management &amp; Appraisal
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label htmlFor="mock-role" className="text-slate-500">
              Demo as
            </label>
            <select
              id="mock-role"
              value={mockRole}
              onChange={(e) => setMockRole(e.target.value as keyof typeof MOCK_CURRENT_USERS)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/40"
            >
              <option value="employee">Employee (view only)</option>
              <option value="manager">Manager (reviewer)</option>
              <option value="hrAdmin">HR Admin (manage)</option>
            </select>
            <span className="hidden text-slate-400 sm:inline">
              signed in as {currentUser.name}
            </span>
          </div>
        </div>
        <nav
          aria-label="PMS navigation"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === PMS_ROUTES.root
                ? pathname === item.href
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1F3A5F] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
