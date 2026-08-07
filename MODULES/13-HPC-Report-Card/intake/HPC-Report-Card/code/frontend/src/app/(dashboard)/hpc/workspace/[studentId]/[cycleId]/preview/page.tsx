'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';

import { WorkspaceTabs } from '@/components/hpc/entry/WorkspaceTabs';
import { HolisticPreview } from '@/components/hpc/preview/HolisticPreview';
import { FinalizeAction } from '@/components/hpc/preview/FinalizeAction';

import { useHolisticPreview } from '@/lib/hooks/useSummary';
import { cardService } from '@/lib/services/card.service';
import { useToast } from '@/components/ui/ToastProvider';
import { ApiError } from '@/lib/api/client';

export default function StudentPreviewPage({
  params,
}: {
  params: Promise<{
    studentId: string;
    cycleId: string;
  }>;
}) {

  const { studentId, cycleId } = use(params);

  const {
    data,
    loading,
    error,
    refetch,
  } = useHolisticPreview(studentId, cycleId);

  const { showToast } = useToast();

  const router = useRouter();

  const isComplete =
    data
      ? data.progress.completed >= data.progress.total &&
        data.progress.total > 0
      : false;

  const handleFinalize = async () => {
    try {
      const result = await cardService.finalize({
        student_id: Number(studentId),
        academic_cycle_id: Number(cycleId),
      });

      showToast(
        result.message || 'Report card finalized.'
      );

      router.push('/hpc/cards');
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : 'Failed to finalize report card.',
        'error'
      );

      throw err;
    }
  };

  return (
    <PageContainer>

      <PageHeader
        title={`Student #${studentId} · Cycle ${cycleId}`}
        description="Review the full holistic report card before finalizing."
        actions={
          <FinalizeAction
            onFinalize={handleFinalize}
            disabled={!isComplete}
          />
        }
      />

      <WorkspaceTabs
        studentId={studentId}
        cycleId={cycleId}
      />

      {loading && (
        <Loading label="Building preview..." />
      )}

      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={refetch}
        />
      )}

      {!loading && !error && data && (
        <>
          {!isComplete && (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              All competencies must be completed before this card can be finalized.
            </p>
          )}

          <HolisticPreview preview={data} />
        </>
      )}

    </PageContainer>
  );
}