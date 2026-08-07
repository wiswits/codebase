import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../../../api/generated/leave';
import type { CreateLeaveRequest, LeaveRequest } from '@shared/schemas/leave';

export function useLeave(hostelId?: string) {
  const queryClient = useQueryClient();

  const { data: leaves, isLoading, error } = useQuery({
    queryKey: ['leaves', hostelId],
    queryFn: async () => {
      const result = await leaveApi.getAll({ hostelId });
      return result;
    },
    enabled: !!hostelId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveRequest) => leaveApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ 
      id, 
      role, 
      decision 
    }: { 
      id: string; 
      role: 'parent' | 'warden'; 
      decision: 'approved' | 'rejected';
    }) => {
      if (role === 'parent') {
        return leaveApi.parentDecision(id, { decision, reason: undefined });
      } else {
        return leaveApi.wardenDecision(id, { decision, reason: undefined });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ 
      id, 
      reason, 
      role 
    }: { 
      id: string; 
      reason: string; 
      role: 'parent' | 'warden';
    }) => {
      if (role === 'parent') {
        return leaveApi.parentDecision(id, { decision: 'rejected', reason });
      } else {
        return leaveApi.wardenDecision(id, { decision: 'rejected', reason });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const getLeave = async (id: string): Promise<LeaveRequest> => {
    const response = await leaveApi.getAll();
    const leave = response.find(l => l.id === id);
    if (!leave) throw new Error('Leave request not found');
    return leave;
  };

  return {
    leaves,
    isLoading,
    error,
    createLeave: createMutation.mutateAsync,
    approveLeave: approveMutation.mutateAsync,
    rejectLeave: rejectMutation.mutateAsync,
    getLeave,
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}