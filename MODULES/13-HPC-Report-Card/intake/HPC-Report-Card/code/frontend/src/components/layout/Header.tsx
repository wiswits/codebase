import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-navy/10 bg-white px-6">
      <div className="md:hidden">
        <p className="font-playfair text-base font-semibold text-navy">EduSuite HPC</p>
      </div>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
        <input
          type="text"
          placeholder="Search students, cards, competencies…"
          className="w-full rounded-full border border-navy/10 bg-background py-2 pl-9 pr-4 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        <div className="mx-1 h-6 w-px bg-navy/10" />

        <div className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-navy/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-playfair text-sm font-semibold text-navy">
            DU
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-navy">Development User</p>
            <p className="text-xs leading-tight text-navy/50">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
