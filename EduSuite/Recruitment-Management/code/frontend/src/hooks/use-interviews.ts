import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewService } from '@/services/interview.service';
import { Interview, InterviewFilters } from '@/types';

export const useInterviews = (filters?: InterviewFilters) => {
  return useQuery({
    queryKey: ['interviews', filters],
    queryFn: () => interviewService.getAll(filters),
  });
};

export const useInterview = (id: number) => {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewService.getById(id),
    enabled: !!id,
  });
};

export const useScheduleInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Interview>) => interviewService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
};

export const useUpdateInterview = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Interview>) => interviewService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
    },
  });
};

export const useUpdateInterviewStatus = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, feedback, rating, recommendation }: any) =>
      interviewService.updateStatus(id, status, feedback, rating, recommendation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
    },
  });
};

export const useUpcomingInterviews = (limit?: number) => {
  return useQuery({
    queryKey: ['upcoming-interviews', limit],
    queryFn: () => interviewService.getUpcoming(limit),
  });
};