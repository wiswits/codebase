import React from 'react';
import { ChevronRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { RecentActivityRow } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/formatters';

export function RecentActivity({ activity }: { activity: RecentActivityRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activity.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No activity yet"
              message="Entries will show up here as teachers start filling out HPC cards."
            />
          </div>
        ) : (
          <ul className="divide-y divide-navy/10">
            {activity.map((row, idx) => (
              <li
                key={idx}
                className="flex items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-background"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">Student #{row.student_id}</p>
                  <p className="truncate text-navy/50">
                    Competency #{row.competency_id} updated · {formatDateTime(row.updated_at)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-navy/30" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
