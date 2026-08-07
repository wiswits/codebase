'use client';

import { use } from 'react';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

import { WorkspaceTabs } from '@/components/hpc/entry/WorkspaceTabs';
import { WorkflowStatusControl } from '@/components/hpc/entry/WorkflowStatusControl';
import { DomainSection } from '@/components/hpc/entry/DomainSection';
import { mergeCompetenciesWithEntries } from '@/components/hpc/entry/mergeEntries';

import { useCompetencies } from '@/lib/hooks/useCompetencies';
import { useStudentEntries } from '@/lib/hooks/useStudentEntries';
import { entryService } from '@/lib/services/entry.service';

import { useToast } from '@/components/ui/ToastProvider';
import { WorkflowStatus } from '@/lib/types';
import { ApiError } from '@/lib/api/client';

type PageProps = {
  params: Promise<{
    studentId: string;
    cycleId: string;
  }>;
};

export default function StudentEntriesPage({ params }: PageProps) {
  const { studentId, cycleId } = use(params);

  const { showToast } = useToast();

  const competencies = useCompetencies();
  const entries = useStudentEntries(studentId, cycleId);

  const loading = competencies.loading || entries.loading;
  const error = competencies.error || entries.error;

  const groups =
    competencies.data && entries.data
      ? mergeCompetenciesWithEntries(
          competencies.data,
          entries.data
        )
      : [];

  const currentStatus =
    entries.data && entries.data.length > 0
      ? entries.data[0].status
      : null;

  const handleSave = async (
    competencyId: number,
    entryValue: string,
    remarks: string
  ) => {
    try {
      await entryService.saveDraft({
        student_id: Number(studentId),
        academic_cycle_id: Number(cycleId),
        competency_id: competencyId,
        entry_value: entryValue,
        remarks,
      });

      showToast('Entry saved.');
      entries.refetch();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : 'Failed to save entry.',
        'error'
      );
    }
  };

  const handleDelete = async (entryId: number) => {
    try {
      await entryService.remove(entryId);

      showToast('Entry deleted.');
      entries.refetch();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : 'Failed to delete entry.',
        'error'
      );
    }
  };

  const handleWorkflowUpdate = async (
    status: WorkflowStatus
  ) => {
    try {
      await entryService.updateWorkflow(
        studentId,
        cycleId,
        status
      );

      showToast('Workflow status updated.');
      entries.refetch();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : 'Failed to update status.',
        'error'
      );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Student #${studentId} · Cycle ${cycleId}`}
        description="Fill out competency ratings and remarks below, grouped by domain."
      />

      <WorkspaceTabs
        studentId={studentId}
        cycleId={cycleId}
      />

      {loading && (
        <Loading label="Loading entries..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            competencies.refetch();
            entries.refetch();
          }}
        />
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          <WorkflowStatusControl
            currentStatus={currentStatus}
            onUpdate={handleWorkflowUpdate}
          />

          {groups.length === 0 ? (
            <EmptyState
              title="No competencies configured"
              message="Add competencies first before entering HPC data for a student."
            />
          ) : (
            groups.map((group) => (
              <DomainSection
                key={group.domain_code}
                group={group}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </PageContainer>
  );
}