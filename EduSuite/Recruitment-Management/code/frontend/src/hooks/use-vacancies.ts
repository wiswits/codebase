import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacancyService } from '@/services/vacancy.service';
import { Vacancy, VacancyFilters } from '@/types';
import toast from 'react-hot-toast';

export const useVacancies = (filters?: VacancyFilters) => {
  return useQuery({
    queryKey: ['vacancies', filters],
    queryFn: () => vacancyService.getAll(filters),
  });
};

export const useVacancy = (id: number) => {
  return useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => vacancyService.getById(id),
    enabled: !!id,
  });
};

export const useCreateVacancy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vacancy>) => vacancyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export const useUpdateVacancy = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vacancy>) => vacancyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      queryClient.invalidateQueries({ queryKey: ['vacancy', id] });
    },
  });
};

export const useDeleteVacancy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vacancyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });
};

export const useChangeVacancyStatus = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => vacancyService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      queryClient.invalidateQueries({ queryKey: ['vacancy', id] });
    },
  });
};