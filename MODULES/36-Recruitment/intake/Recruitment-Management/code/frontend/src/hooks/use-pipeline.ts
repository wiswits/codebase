import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineService } from '@/services/pipeline.service';
import { Applicant } from '@/types';
import toast from 'react-hot-toast';

export const usePipelineStats = () => {
  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: () => pipelineService.getStats(),
  });
};

export const usePipeline = () => {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: () => pipelineService.getAll(),
  });
};

export const useApplicantsByStage = (stage: string) => {
  return useQuery({
    queryKey: ['applicants-by-stage', stage],
    queryFn: () => pipelineService.getByStage(stage),
    enabled: !!stage,
  });
};

export const useMoveApplicant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, remarks }: { id: number; stage: string; remarks?: string }) =>
      pipelineService.moveToStage(id, stage, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Applicant moved successfully');
    },
  });
};

export const useApplicantHistory = (id: number) => {
  return useQuery({
    queryKey: ['applicant-history', id],
    queryFn: () => pipelineService.getHistory(id),
    enabled: !!id,
  });
};