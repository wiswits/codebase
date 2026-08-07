'use client';

import { use } from 'react';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';

import { CardDetailView } from '@/components/hpc/cards/CardDetailView';
import { useCard } from '@/lib/hooks/useCards';

type PageProps = {
  params: Promise<{
    cardId: string;
  }>;
};

export default function CardDetailPage({ params }: PageProps) {
  const { cardId } = use(params);

  const {
    data,
    loading,
    error,
    refetch,
  } = useCard(cardId);

  return (
    <PageContainer>
      <PageHeader
        title={`Report Card #${cardId}`}
        description="Finalized, immutable snapshot of this student's HPC report card."
      />

      {loading && (
        <Loading label="Loading report card..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={refetch}
        />
      )}

      {!loading && !error && data && (
        <CardDetailView card={data} />
      )}
    </PageContainer>
  );
}