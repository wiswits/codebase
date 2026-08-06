import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelApi } from '../../../api/generated/hierarchy';
import type { Hostel, CreateHostel, UpdateHostel } from '@shared/schemas/hostel';

export function useHostels() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => {
      const result = await hostelApi.getAll();
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateHostel) => hostelApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHostel }) =>
      hostelApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hostelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    },
  });

  return {
    hostels: data,
    isLoading,
    error,
    createHostel: createMutation.mutateAsync,
    updateHostel: updateMutation.mutateAsync,
    deleteHostel: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}