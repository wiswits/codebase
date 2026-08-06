'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataStates } from '@/components/shared/DataStates';
import { applicantService } from '@/services/applicant.service';
import { RECRUITMENT_STAGES, STAGE_COLORS } from '@/utils/constants';
import { KanbanColumn } from '@/components/recruitment/pipeline/kanban-column';
import toast from 'react-hot-toast';

export default function PipelinePage() {
  const queryClient = useQueryClient();

  // ✅ Get pipeline stats
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: () => applicantService.getPipelineStats(),
  });

  // ✅ Get applicants - access the items array
  const { data: applicantsData, isLoading: applicantsLoading } = useQuery({
    queryKey: ['applicants-all'],
    queryFn: () => applicantService.getAll({ limit: 200 }),
  });

  // ✅ Extract the items array - this is the fix!
  const applicants = applicantsData?.items || [];

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      applicantService.changeStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['applicants-all'] });
      toast.success('Applicant moved successfully');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Group applicants by stage - ✅ Now works with array
  const getApplicantsByStage = (stage: string) => {
    return applicants.filter((a) => a.currentStage === stage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const applicantId = parseInt(active.id as string);
    const newStage = over.id as string;

    // Find the applicant - ✅ Now works with array
    const applicant = applicants.find((a) => a.id === applicantId);
    if (!applicant || applicant.currentStage === newStage) return;

    // Check if stage is valid
    if (!RECRUITMENT_STAGES.includes(newStage as any)) return;

    stageMutation.mutate({ id: applicantId, stage: newStage });
  };

  const isLoading = statsLoading || applicantsLoading;

  return (
    <div>
      <PageHeader
        title="Recruitment Pipeline"
        description="Drag and drop applicants between stages"
      />

      <DataStates
        isLoading={isLoading}
        error={statsError}
        isEmpty={applicants.length === 0}
        emptyMessage="No applicants in pipeline"
        onRetry={refetch}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {RECRUITMENT_STAGES.map((stage) => {
              const stageApplicants = getApplicantsByStage(stage);
              const count = stats?.[stage] || 0;

              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  count={count}
                  applicants={stageApplicants}
                  colorClass={STAGE_COLORS[stage] || ''}
                />
              );
            })}
          </div>
        </DndContext>
      </DataStates>
    </div>
  );
}