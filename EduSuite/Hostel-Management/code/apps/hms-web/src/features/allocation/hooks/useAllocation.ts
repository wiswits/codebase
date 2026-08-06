import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationApi } from '../../../api/generated/allocation';
import type { CreateAllocation, VacateAllocation } from '@shared/schemas/allocation';

export function useAllocation() {
  const queryClient = useQueryClient();

  const { data: allocations, isLoading, error } = useQuery({
    queryKey: ['allocations'],
    queryFn: async () => {
      const result = await allocationApi.getAll({ active: true });
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAllocation) => allocationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const vacateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VacateAllocation }) =>
      allocationApi.vacate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });

  const getStudentResidency = useQuery({
    queryKey: ['student-residency'],
    queryFn: async () => {
      // This would get the current user's residency
      // Implementation depends on auth context
    },
  });

  return {
    allocations,
    isLoading,
    error,
    createAllocation: createMutation.mutateAsync,
    vacateAllocation: vacateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isVacating: vacateMutation.isPending,
    getStudentResidency,
  };
}