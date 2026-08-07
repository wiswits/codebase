import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicantService } from '@/services/applicant.service';
import { Applicant, ApplicantFilters } from '@/types';

export const useApplicants = (filters?: ApplicantFilters) => {
  return useQuery({
    queryKey: ['applicants', filters],
    queryFn: () => applicantService.getAll(filters),
  });
};

export const useApplicant = (id: number) => {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantService.getById(id),
    enabled: !!id,
  });
};

export const useCreateApplicant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Applicant>) => applicantService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

export const useUpdateApplicant = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Applicant>) => applicantService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
    },
  });
};

export const useDeleteApplicant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicantService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

export const useChangeApplicantStage = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stage, remarks }: { stage: string; remarks?: string }) =>
      applicantService.changeStage(id, stage, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stats'] });
    },
  });
};

export const useBulkImportApplicants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicants: Partial<Applicant>[]) => applicantService.bulkImport(applicants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

