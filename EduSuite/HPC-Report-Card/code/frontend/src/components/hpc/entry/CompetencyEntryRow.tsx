'use client';

import React, { useState } from 'react';
import { Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { MergedCompetencyRow } from './mergeEntries';

interface CompetencyEntryRowProps {
  row: MergedCompetencyRow;
  onSave: (competencyId: number, entryValue: string, remarks: string) => Promise<void>;
  onDelete: (entryId: number) => Promise<void>;
}

export function CompetencyEntryRow({ row, onSave, onDelete }: CompetencyEntryRowProps) {
  const { competency, entry } = row;
  const [entryValue, setEntryValue] = useState(entry?.entry_value ?? '');
  const [remarks, setRemarks] = useState(entry?.remarks ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dirty = entryValue !== (entry?.entry_value ?? '') || remarks !== (entry?.remarks ?? '');

  const handleSave = async () => {
    if (!entryValue.trim()) return;
    setIsSaving(true);
    try {
      await onSave(competency.id, entryValue.trim(), remarks.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      setEntryValue('');
      setRemarks('');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-navy/10 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-navy">{competency.competency_name}</p>
          {competency.descriptor_text && (
            <p className="text-xs text-navy/50">{competency.descriptor_text}</p>
          )}
        </div>
        <StatusBadge status={entry?.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <Input
          placeholder="e.g. Proficient"
          value={entryValue}
          onChange={(e) => setEntryValue(e.target.value)}
        />
        <Textarea
          placeholder="Remarks (optional)"
          rows={1}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {entry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={!dirty || !entryValue.trim()} isLoading={isSaving}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
