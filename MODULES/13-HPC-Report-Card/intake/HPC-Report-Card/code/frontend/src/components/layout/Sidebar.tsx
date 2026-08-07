'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, ClipboardList, Award } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/hpc', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hpc/competencies', label: 'Competencies', icon: ListChecks },
  { href: '/hpc/workspace', label: 'Entry Workspace', icon: ClipboardList },
  { href: '/hpc/cards', label: 'Report Cards', icon: Award },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-navy md:flex">
      <div className="px-5 py-6">
        <p className="font-playfair text-lg font-semibold text-ivory">WisWits</p>
        <div className="mt-2 mb-2 h-[2px] w-8 rounded-full bg-gold" />
        <p className="text-xs tracking-wide text-ivory/60">HPC Report Card</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/hpc' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-gold text-navy shadow-sm'
                  : 'text-ivory hover:bg-white/[.08] hover:text-ivory'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-navy' : 'text-ivory')} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
