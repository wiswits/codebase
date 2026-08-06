"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Calendar,
  FileText,
  LogOut,
} from "lucide-react";

import { cn } from "@/utils/cn";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems: {
  href: string;
  label: string;
  icon: any;
}[] = [
  {
    href: "/recruitment",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/recruitment/vacancies",
    label: "Vacancies",
    icon: Briefcase,
  },
  {
    href: "/recruitment/applicants",
    label: "Applicants",
    icon: Users,
  },
  {
    href: "/recruitment/pipeline",
    label: "Pipeline",
    icon: Kanban,
  },
  {
    href: "/recruitment/interviews",
    label: "Interviews",
    icon: Calendar,
  },
  {
    href: "/recruitment/offers",
    label: "Offers",
    icon: FileText,
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#0F2147] text-white transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C8A04E] text-[#0F2147] font-bold">
              E
            </div>

            <div>
              <h1 className="font-semibold text-lg">
                EduSuite
              </h1>

              <p className="text-xs text-white/60">
                Recruitment
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                    isActive(item.href)
                      ? "bg-[#C8A04E] text-[#0F2147] font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={18} />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <button
            className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
    </>
  );
}

export default Sidebar;