import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { EmptyState } from '@/components/common/EmptyState';
import { DomainSummaryRow } from '@/lib/types';

type Props = {
  rows?: DomainSummaryRow[];
};

export function DomainSummaryView({ rows = [] }: Props) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No domain data"
        message="Add competencies to see a domain breakdown."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.domain_code}>
          <CardHeader>
            <CardTitle className="text-base">
              {row.domain_name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="mb-2 text-xs text-navy/50">
              {row.completed_entries} of {row.total_competencies} competencies completed
            </p>

            <Progress
              value={row.completed_entries}
              max={row.total_competencies}
              showLabel
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}