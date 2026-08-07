'use client';

import React, { use } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { WorkspaceTabs } from '@/components/hpc/entry/WorkspaceTabs';
import { DomainSummaryView } from '@/components/hpc/summary/DomainSummaryView';
import { useDomainSummary, useProgress } from '@/lib/hooks/useSummary';

export default function StudentSummaryPage({
  params,
}: {
  params: Promise<{
    studentId: string;
    cycleId: string;
  }>;
}) {
  const { studentId, cycleId } = use(params);

  const summary = useDomainSummary(studentId, cycleId);
  const progress = useProgress(studentId, cycleId);

  const loading = summary.loading || progress.loading;
  const error = summary.error || progress.error;

  return (
    <PageContainer>
      <PageHeader
        title={`Student #${studentId} · Cycle ${cycleId}`}
        description="Domain-by-domain completion for this student's HPC card."
      />

      <WorkspaceTabs
        studentId={studentId}
        cycleId={cycleId}
      />

      {loading && (
        <Loading label="Loading summary..." />
      )}

      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={() => {
            summary.refetch();
            progress.refetch();
          }}
        />
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">

          {progress.data && (
            <Card>
              <CardContent className="flex items-center gap-6">

                <div className="flex-1">
                  <p className="text-xs text-navy/50">
                    Overall progress
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-navy">
                    {progress.data.completed} / {progress.data.total}
                  </p>
                </div>

                <div className="flex-1">
                  <Progress
                    value={progress.data.completed}
                    max={progress.data.total}
                    showLabel
                  />
                </div>

              </CardContent>
            </Card>
          )}

          <DomainSummaryView
            rows={summary.data ?? []}
          />

        </div>
      )}

    </PageContainer>
  );
}