import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CompetencyEntryRow } from './CompetencyEntryRow';
import { DomainGroup as DomainGroupType } from './mergeEntries';

interface DomainSectionProps {
  group: DomainGroupType;
  onSave: (competencyId: number, entryValue: string, remarks: string) => Promise<void>;
  onDelete: (entryId: number) => Promise<void>;
}

export function DomainSection({ group, onSave, onDelete }: DomainSectionProps) {
  const completed = group.rows.filter((r) => r.entry?.entry_value).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{group.domain_name}</CardTitle>
        <span className="text-xs text-navy/50">
          {completed} / {group.rows.length} complete
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {group.rows.map((row) => (
          <CompetencyEntryRow
            key={row.competency.id}
            row={row}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </CardContent>
    </Card>
  );
}
