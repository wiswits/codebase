'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Applicant } from '@/types';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { GripVertical } from 'lucide-react';

interface KanbanCardProps {
  applicant: Applicant;
}

export function KanbanCard({ applicant }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(applicant.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-gold'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab mt-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/recruitment/applicants/${applicant.id}`}
            className="font-medium text-sm text-navy hover:text-gold truncate block"
          >
            {applicant.fullName}
          </Link>
          <p className="text-xs text-gray-500 truncate">{applicant.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {applicant.jobTitle && (
              <span className="text-xs text-gray-500">{applicant.jobTitle}</span>
            )}
            {applicant.totalExperience > 0 && (
              <Badge variant="info" className="text-xs">
                {applicant.totalExperience}y
              </Badge>
            )}
            {applicant.applicationSource && (
              <Badge className="text-xs">
                {applicant.applicationSource}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}