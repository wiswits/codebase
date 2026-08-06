'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { DataStates } from '@/components/shared/DataStates';
import { vacancyService } from '@/services/vacancy.service';
import { VACANCY_STATUSES, VACANCY_STATUS_COLORS } from '@/utils/constants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function VacanciesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vacancies', search, statusFilter],
    queryFn: () =>
      vacancyService.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vacancyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      setShowDeleteModal(false);
      toast.success('Vacancy deleted successfully');
    },
  });

  const vacancies = data?.items || [];

  const handleDelete = (id: number) => {
    setSelectedVacancy(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedVacancy) {
      deleteMutation.mutate(selectedVacancy);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vacancies"
        description="Manage job vacancies"
        actions={
          <Link href="/recruitment/vacancies/create">
            <Button variant="gold">
              <Plus size={18} className="mr-2" />
              Create Vacancy
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-50">
          <Input
            placeholder="Search vacancies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-45">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              ...VACANCY_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Apply Filters
        </Button>
        {(search || statusFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
            }}
          >
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      <DataStates
        isLoading={isLoading}
        error={error}
        isEmpty={vacancies.length === 0}
        emptyMessage="No vacancies found. Create your first vacancy!"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4">
          {vacancies.map((vacancy) => (
            <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-navy text-lg">
                        {vacancy.jobTitle}
                      </h3>
                      <Badge
                        variant={
                          vacancy.status === 'Open'
                            ? 'success'
                            : vacancy.status === 'Draft'
                            ? 'default'
                            : vacancy.status === 'On Hold'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {vacancy.status}
                      </Badge>
                      <Badge variant="info">{vacancy.department}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📋 {vacancy.vacancyCode}</span>
                      <span>📍 {vacancy.location || 'Remote'}</span>
                      <span>💼 {vacancy.employmentType}</span>
                      <span>🎯 {vacancy.numberOfOpenings} openings</span>
                      {vacancy.salaryMin && vacancy.salaryMax && (
                        <span>
                          💰 ₹{vacancy.salaryMin.toLocaleString()} - ₹
                          {vacancy.salaryMax.toLocaleString()}
                        </span>
                      )}
                      <span>
  📅{" "}
  {vacancy.applicationStartDate
    ? format(new Date(vacancy.applicationStartDate), "MMM d, yyyy")
    : "N/A"}

  {" - "}

  {vacancy.applicationEndDate
    ? format(new Date(vacancy.applicationEndDate), "MMM d, yyyy")
    : "N/A"}
</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/recruitment/vacancies/${vacancy.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Link href={`/recruitment/vacancies/${vacancy.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vacancy.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataStates>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-navy">Delete Vacancy</h3>
              <p className="text-gray-500 mt-2">
                Are you sure you want to delete this vacancy? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isLoading={deleteMutation.isPending}
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}