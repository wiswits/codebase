'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CompetencyTable } from '@/components/hpc/competency/CompetencyTable';
import { CompetencyForm } from '@/components/hpc/competency/CompetencyForm';
import { useCompetencies } from '@/lib/hooks/useCompetencies';
import { competencyService } from '@/lib/services/competency.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Competency, CompetencyInput } from '@/lib/types';
import { ApiError } from '@/lib/api/client';

export default function CompetenciesPage() {
  const { data, loading, error, refetch } = useCompetencies();
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Competency | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Competency | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (competency: Competency) => {
    setEditing(competency);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CompetencyInput) => {
    if (editing) {
      await competencyService.update(editing.id, input);
      showToast('Competency updated.');
    } else {
      await competencyService.create(input);
      showToast('Competency created.');
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await competencyService.remove(pendingDelete.id);
      showToast('Competency deleted.');
      setPendingDelete(null);
      refetch();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete competency.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Competencies"
        description="Manage the domains and competencies that make up an HPC report card."
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New competency
          </Button>
        }
      />

      {loading && <Loading label="Loading competencies…" />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <CompetencyTable
          competencies={data}
          onEdit={handleEdit}
          onDelete={(c) => setPendingDelete(c)}
        />
      )}

      <CompetencyForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete competency?"
        message={`This will permanently remove "${pendingDelete?.competency_name}". Existing entries referencing it will also be removed.`}
        confirmLabel="Delete"
        isDanger
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </PageContainer>
  );
}
