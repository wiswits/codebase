"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  GraduationCap,
  LayoutDashboard,
  Users
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/alumni",
    icon: LayoutDashboard
  },
  {
    name: "Alumni Directory",
    href: "/alumni/directory",
    icon: Users
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-navy lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-navy">
          <GraduationCap size={22} />
        </div>

        <div>
          <p className="font-display text-xl font-bold text-white">
            EduSuite
          </p>

          <p className="text-xs text-white/60">
            Alumni Directory
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/alumni"
              ? pathname === "/alumni"
              : pathname.startsWith(
                  item.href
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-gold text-navy shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />

              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Module
        </p>

        <p className="mt-2 text-sm text-white/70">
          STL-ALU
        </p>

        <p className="mt-1 text-xs text-white/45">
          Standalone Integration
        </p>
      </div>
    </aside>
  );
}