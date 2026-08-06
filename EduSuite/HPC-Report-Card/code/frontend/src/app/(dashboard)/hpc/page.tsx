'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { DashboardStats } from '@/components/hpc/dashboard/DashboardStats';
import { RecentActivity } from '@/components/hpc/dashboard/RecentActivity';
import { useDashboard } from '@/lib/hooks/useDashboard';

export default function HpcDashboardPage() {
  const { data, loading, error, refetch } = useDashboard();

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of HPC report card activity across your organization."
      />

      {loading && <Loading label="Loading dashboard…" />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {data && !loading && !error && (
        <div className="flex flex-col gap-6">
          <DashboardStats statistics={data.statistics} />
          <RecentActivity activity={data.recentActivity} />
        </div>
      )}
    </PageContainer>
  );
}
