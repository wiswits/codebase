'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2, X, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { DataStates } from '@/components/shared/DataStates';
import { applicantService } from '@/services/applicant.service';
import { vacancyService } from '@/services/vacancy.service';
import { RECRUITMENT_STAGES, APPLICATION_SOURCES, STAGE_COLORS } from '@/utils/constants';
import { format } from 'date-fns';

export default function ApplicantsPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [vacancyFilter, setVacancyFilter] = useState('');

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies-dropdown'],
    queryFn: () => vacancyService.getAll({ limit: 100 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['applicants', search, stageFilter, vacancyFilter],
    queryFn: () =>
      applicantService.getAll({
        search: search || undefined,
        currentStage: stageFilter || undefined,
        vacancyId: vacancyFilter ? parseInt(vacancyFilter) : undefined,
        limit: 100,
      }),
  });

  const applicants = data?.items || [];

  return (
    <div>
      <PageHeader
        title="Applicants"
        description="Manage job applicants"
        actions={
          <div className="flex gap-2">
            <Link href="/recruitment/applicants/import">
              <Button variant="outline">
                <Upload size={18} className="mr-2" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/recruitment/applicants/create">
              <Button variant="gold">
                <Plus size={18} className="mr-2" />
                Add Applicant
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-50">
          <Input
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-45">
          <Select
            options={[
              { value: '', label: 'All Stages' },
              ...RECRUITMENT_STAGES.map((s) => ({ value: s, label: s })),
            ]}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          />
        </div>
        <div className="w-50">
          <Select
            options={[
              { value: '', label: 'All Vacancies' },
              ...(vacancies?.items || []).map((v) => ({
                value: String(v.id),
                label: v.jobTitle,
              })),
            ]}
            value={vacancyFilter}
            onChange={(e) => setVacancyFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Apply Filters
        </Button>
        {(search || stageFilter || vacancyFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStageFilter('');
              setVacancyFilter('');
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
        isEmpty={applicants.length === 0}
        emptyMessage="No applicants found. Add your first applicant!"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4">
          {applicants.map((applicant) => (
            <Card key={applicant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-navy text-lg">
                        {applicant.fullName}
                      </h3>
                      <Badge className={STAGE_COLORS[applicant.currentStage] || ''}>
                        {applicant.currentStage}
                      </Badge>
                      <Badge variant={applicant.status === 'Active' ? 'success' : 'default'}>
                        {applicant.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📧 {applicant.email}</span>
                      <span>📱 {applicant.phone}</span>
                      <span>💼 {applicant.jobTitle || 'N/A'}</span>
                      <span>📋 {applicant.applicantCode}</span>
                      <span>
  📅 Applied{" "}
  {applicant.applicationDate
    ? format(new Date(applicant.applicationDate), "MMM d, yyyy")
    : "N/A"}
</span>⏱ {applicant.totalExperience} years
                      
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/recruitment/applicants/${applicant.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Link href={`/recruitment/applicants/${applicant.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataStates>
    </div>
  );
}