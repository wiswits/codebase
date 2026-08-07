import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { attendanceApi } from '../../../api/generated/attendance';
import type { CreateAttendanceBulk } from '@shared/schemas/attendance';

export function useAttendance(hostelId?: string, date?: Date) {
  const queryClient = useQueryClient();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const { data: roster, isLoading: rosterLoading } = useQuery({
    queryKey: ['attendance-roster', hostelId, dateStr],
    queryFn: async () => {
      if (!hostelId) return [];
      const result = await attendanceApi.getRoster({
        hostelId,
        date: dateStr,
      });
      return result;
    },
    enabled: !!hostelId,
  });

  const { data: missingStudents, isLoading: missingLoading } = useQuery({
    queryKey: ['attendance-missing', hostelId, dateStr],
    queryFn: async () => {
      if (!hostelId) return [];
      const result = await attendanceApi.getMissing({
        hostelId,
        date: dateStr,
      });
      return result;
    },
    enabled: !!hostelId,
  });

  const submitMutation = useMutation({
    mutationFn: (data: CreateAttendanceBulk) => attendanceApi.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-roster', hostelId, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['attendance-missing', hostelId, dateStr] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: (data: { passCode?: string; studentQr?: string; deviceId?: string }) =>
      attendanceApi.scanQR(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-roster', hostelId, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['attendance-missing', hostelId, dateStr] });
    },
  });

  const alertMutation = useMutation({
    mutationFn: async () => {
      // Implementation would call APEX notification service
      const response = await fetch('/apex/v1/notifications/alert-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostelId, date: dateStr, missingStudents }),
      });
      return response.json();
    },
  });

  return {
    roster,
    missingStudents,
    isLoading: rosterLoading || missingLoading,
    submitAttendance: submitMutation.mutateAsync,
    scanQR: scanMutation.mutateAsync,
    alertParents: alertMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    isScanning: scanMutation.isPending,
    isAlerting: alertMutation.isPending,
  };
}