"use client";

import Link from "next/link";

import {
  Bell,
  Menu,
  Search
} from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-navy transition hover:bg-slate-50 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="font-display text-lg font-bold text-navy">
            Alumni Management
          </p>

          <p className="hidden text-xs text-slate-500 sm:block">
            Manage and explore your alumni community
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/alumni/directory"
          aria-label="Search alumni"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy"
        >
          <Search size={19} />
        </Link>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
        </button>

        <div className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          TL
        </div>
      </div>
    </header>
  );
}