import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { FinalizedCardSummary } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

export function RecentCardsTable({ cards }: { cards: FinalizedCardSummary[] }) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No finalized cards yet"
        message="Finalized HPC report cards will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      <table className="w-full text-left text-sm">
        <thead className="bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
          <tr>
            <th className="px-4 py-3">Card ID</th>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Cycle</th>
            <th className="px-4 py-3">Finalized at</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/10">
          {cards.map((card, idx) => (
            <tr
              key={card.id}
              className={cn(
                'transition-colors hover:bg-background',
                idx % 2 === 1 && 'bg-navy/[.02]'
              )}
            >
              <td className="px-4 py-3 text-navy/60">#{card.id}</td>
              <td className="px-4 py-3 text-navy">Student #{card.student_id}</td>
              <td className="px-4 py-3 text-navy">{card.academic_cycle_id}</td>
              <td className="px-4 py-3 text-navy/60">{formatDateTime(card.finalized_at)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/hpc/cards/${card.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-gold-dark"
                >
                  View
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
