import React from 'react';
import { Users, FileEdit, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { DashboardStatistics } from '@/lib/types';

export function DashboardStats({ statistics }: { statistics: DashboardStatistics }) {
  const items = [
    {
      label: 'Students with entries',
      value: statistics.total_students,
      icon: Users,
      iconColor: 'text-navy',
      iconBg: 'bg-navy/10',
    },
    {
      label: 'Draft',
      value: statistics.draft_cards,
      icon: FileEdit,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      label: 'In progress',
      value: statistics.in_progress_cards,
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Ready for review',
      value: statistics.ready_for_review_cards,
      icon: Clock,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Finalized',
      value: statistics.finalized_cards,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
        <Card key={label}>
          <CardContent className="flex flex-col gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </span>
            <p className="text-3xl font-semibold text-navy tabular-nums">{value ?? 0}</p>
            <p className="text-xs text-navy/50">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
