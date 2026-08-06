'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface WorkspaceTabsProps {
  studentId: string;
  cycleId: string;
}

export function WorkspaceTabs({ studentId, cycleId }: WorkspaceTabsProps) {
  const pathname = usePathname();
  const base = `/hpc/workspace/${studentId}/${cycleId}`;

  const tabs = [
    { href: base, label: 'Entries' },
    { href: `${base}/summary`, label: 'Summary' },
    { href: `${base}/preview`, label: 'Preview & finalize' },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-navy/10">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-gold text-navy'
                : 'border-transparent text-navy/50 hover:text-navy'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
