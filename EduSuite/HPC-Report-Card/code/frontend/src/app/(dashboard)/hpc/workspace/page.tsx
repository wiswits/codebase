import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { StudentCycleSelector } from '@/components/hpc/entry/StudentCycleSelector';

export default function WorkspaceEntryPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Entry workspace"
        description="Enter a student ID and academic cycle to fill out or review their HPC card."
      />
      <StudentCycleSelector />
    </PageContainer>
  );
}
