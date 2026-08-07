'use client';

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { RecentCardsTable } from '@/components/hpc/cards/RecentCardsTable';
import { useRecentCards } from '@/lib/hooks/useCards';

export default function CardsPage() {
  const { data, loading, error, refetch } = useRecentCards(20);

  return (
    <PageContainer>
      <PageHeader
        title="Finalized report cards"
        description="The most recently finalized HPC report cards for your organization."
      />

      {loading && <Loading label="Loading report cards…" />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {data && !loading && !error && <RecentCardsTable cards={data} />}
    </PageContainer>
  );
}
