import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from '@/services/offer.service';
import { Offer, OfferFilters } from '@/types';

export const useOffers = (filters?: OfferFilters) => {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: () => offerService.getAll(filters),
  });
};

export const useOffer = (id: number) => {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: () => offerService.getById(id),
    enabled: !!id,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Offer>) => offerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
};

export const useUpdateOffer = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Offer>) => offerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
    },
  });
};

export const useUpdateOfferStatus = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, acceptedOn }: { status: string; acceptedOn?: string }) =>
      offerService.updateStatus(id, status, acceptedOn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
    },
  });
};

export const useOfferStats = () => {
  return useQuery({
    queryKey: ['offer-stats'],
    queryFn: () => offerService.getStats(),
  });
};