'use client';

import { useDroppable } from '@dnd-kit/core';
import { Applicant } from '@/types';
import { KanbanCard } from './kanban-card';
import { cn } from '@/utils/cn';

interface KanbanColumnProps {
  stage: string;
  count: number;
  applicants: Applicant[];
  colorClass: string;
}

export function KanbanColumn({
  stage,
  count,
  applicants,
  colorClass,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'shrink-0 w-70 bg-gray-50 rounded-lg p-3',
        isOver && 'ring-2 ring-gold bg-gray-100'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-navy">{stage}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <span className={cn('w-2 h-2 rounded-full', colorClass)} />
      </div>

      <div className="space-y-2 min-h-25">
        {applicants.map((applicant) => (
          <KanbanCard key={applicant.id} applicant={applicant} />
        ))}
        {applicants.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No applicants
          </div>
        )}
      </div>
    </div>
  );
}