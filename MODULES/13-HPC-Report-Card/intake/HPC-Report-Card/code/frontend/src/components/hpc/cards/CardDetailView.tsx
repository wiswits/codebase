import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { HolisticPreview } from '@/components/hpc/preview/HolisticPreview';
import { DomainSummaryView } from '@/components/hpc/summary/DomainSummaryView';
import { CardSnapshot, FinalizedCard } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/formatters';

export function CardDetailView({ card }: { card: FinalizedCard }) {
  let snapshot: CardSnapshot | null = null;
  try {
    snapshot = JSON.parse(card.snapshot_json);
  } catch {
    snapshot = null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-navy/50">Card ID</p>
            <p className="font-medium text-navy">#{card.id}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Student</p>
            <p className="font-medium text-navy">#{card.student_id}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Academic cycle</p>
            <p className="font-medium text-navy">{card.academic_cycle_id}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Finalized at</p>
            <p className="font-medium text-navy">{formatDateTime(card.finalized_at)}</p>
          </div>
        </CardContent>
      </Card>

      {snapshot && (
        <>
          <div>
            <h3 className="mb-3 font-playfair text-lg font-semibold text-navy">Domain summary</h3>
            <DomainSummaryView rows={snapshot.summary} />
          </div>
          <div>
            <h3 className="mb-3 font-playfair text-lg font-semibold text-navy">Full card</h3>
            <HolisticPreview
              preview={{ progress: snapshot.progress, competencies: snapshot.competencies }}
            />
          </div>
        </>
      )}
    </div>
  );
}
