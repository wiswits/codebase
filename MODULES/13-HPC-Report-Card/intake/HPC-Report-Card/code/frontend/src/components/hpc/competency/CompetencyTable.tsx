import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Competency } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils/cn';

interface CompetencyTableProps {
  competencies: Competency[];
  onEdit: (competency: Competency) => void;
  onDelete: (competency: Competency) => void;
}

export function CompetencyTable({ competencies, onEdit, onDelete }: CompetencyTableProps) {
  if (competencies.length === 0) {
    return (
      <EmptyState
        title="No competencies yet"
        message="Add the first competency to start building HPC report cards."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      <table className="w-full text-left text-sm">
        <thead className="bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
          <tr>
            <th className="px-4 py-3">Domain</th>
            <th className="px-4 py-3">Competency</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/10">
          {competencies.map((c, idx) => (
            <tr
              key={c.id}
              className={cn(
                'transition-colors hover:bg-background',
                idx % 2 === 1 && 'bg-navy/[.02]'
              )}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-navy">{c.domain_name}</p>
                <p className="text-xs text-navy/40">{c.domain_code}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-navy">{c.competency_name}</p>
                {c.descriptor_text && (
                  <p className="max-w-xs truncate text-xs text-navy/40">{c.descriptor_text}</p>
                )}
              </td>
              <td className="px-4 py-3 text-navy/60">{c.competency_code}</td>
              <td className="px-4 py-3">
                <Badge
                  className={
                    c.is_active
                      ? 'bg-emerald-500 text-white border-transparent'
                      : 'bg-slate-400 text-white border-transparent'
                  }
                >
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(c)}
                    aria-label="Delete"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
