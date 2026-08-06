import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingApi, wingApi, floorApi, roomApi, bedApi } from '../../../api/generated/hierarchy';
import type { Building, Wing, Floor, Room, Bed } from '@shared/schemas/hostel';

export function useHierarchy(
  hostelId?: string,
  buildingId?: string,
  wingId?: string,
  floorId?: string
) {
  const queryClient = useQueryClient();

  // Buildings
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings', hostelId],
    queryFn: async () => {
      const result = await buildingApi.getByHostel(hostelId!);
      return result;
    },
    enabled: !!hostelId,
  });

  // Wings
  const { data: wings, isLoading: wingsLoading } = useQuery({
    queryKey: ['wings', buildingId],
    queryFn: async () => {
      const result = await wingApi.getByBuilding(buildingId!);
      return result;
    },
    enabled: !!buildingId,
  });

  // Floors
  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors', wingId],
    queryFn: async () => {
      const result = await floorApi.getByWing(wingId!);
      return result;
    },
    enabled: !!wingId,
  });

  // Rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      const result = await roomApi.getByFloor(floorId!);
      return result;
    },
    enabled: !!floorId,
  });

  // Mutations
  const createBuilding = useMutation({
    mutationFn: (data: { hostelId: string; code: string; name: string; caretakerUserId?: string }) =>
      buildingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings', hostelId] });
    },
  });

  const createWing = useMutation({
    mutationFn: (data: { buildingId: string; code: string; direction?: 'E' | 'W' | 'N' | 'S'; caretakerUserId?: string }) =>
      wingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wings', buildingId] });
    },
  });

  const createFloor = useMutation({
    mutationFn: (data: { wingId: string; floorNumber: number }) =>
      floorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', wingId] });
    },
  });

  const createRoom = useMutation({
    mutationFn: (data: { floorId: string; roomNumber: string; roomType: string; maxCapacity: number; furniture?: Record<string, unknown> }) =>
      roomApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
    },
  });

  const createBeds = useMutation({
    mutationFn: (data: { roomId: string; bedLabels: string[]; bedType?: string; rentTier: string }) =>
      bedApi.createBulk(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
      queryClient.invalidateQueries({ queryKey: ['beds', variables.roomId] });
    },
  });

  const deleteBuilding = useMutation({
    mutationFn: (id: string) => buildingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings', hostelId] });
    },
  });

  const deleteWing = useMutation({
    mutationFn: (id: string) => wingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wings', buildingId] });
    },
  });

  const deleteFloor = useMutation({
    mutationFn: (id: string) => floorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', wingId] });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: (id: string) => roomApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
    },
  });

  return {
    buildings,
    wings,
    floors,
    rooms,
    isLoading: buildingsLoading || wingsLoading || floorsLoading || roomsLoading,
    createBuilding: createBuilding.mutateAsync,
    createWing: createWing.mutateAsync,
    createFloor: createFloor.mutateAsync,
    createRoom: createRoom.mutateAsync,
    createBeds: createBeds.mutateAsync,
    deleteBuilding: deleteBuilding.mutateAsync,
    deleteWing: deleteWing.mutateAsync,
    deleteFloor: deleteFloor.mutateAsync,
    deleteRoom: deleteRoom.mutateAsync,
  };
}