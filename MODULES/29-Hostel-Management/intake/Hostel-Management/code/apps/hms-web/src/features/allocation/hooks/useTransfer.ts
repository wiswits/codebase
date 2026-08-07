import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '../../../api/generated/allocation';
import type { Transfer } from '@shared/schemas/allocation';

export function useTransfer() {
  const queryClient = useQueryClient();

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const result = await transferApi.getAll();
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Transfer) => transferApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, newBedId }: { id: string; newBedId?: string }) =>
      transferApi.approve(id, newBedId ? { newBedId } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      transferApi.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });

  const getHistory = (studentId: string) => {
    return useQuery({
      queryKey: ['transfer-history', studentId],
      queryFn: () => transferApi.getHistory(studentId),
      enabled: !!studentId,
    });
  };

  return {
    transfers,
    isLoading,
    error,
    createTransfer: createMutation.mutateAsync,
    approveTransfer: approveMutation.mutateAsync,
    rejectTransfer: rejectMutation.mutateAsync,
    getHistory,
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}