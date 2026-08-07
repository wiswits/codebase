'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Users, Calendar, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { DataStates } from '@/components/shared/DataStates';
import { vacancyService } from '@/services/vacancy.service';
import { applicantService } from '@/services/applicant.service';
import { VACANCY_STATUS_COLORS } from '@/utils/constants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function VacancyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(params.id as string);

  const { data: vacancy, isLoading, error, refetch } = useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => vacancyService.getById(id),
    enabled: !isNaN(id),
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ['applicants-by-vacancy', id],
    queryFn: () => applicantService.getByVacancy(id),
    enabled: !isNaN(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => vacancyService.delete(id),
    onSuccess: () => {
      toast.success('Vacancy deleted successfully');
      router.push('/recruitment/vacancies');
    },
  });

  if (isNaN(id)) {
    return <div>Invalid vacancy ID</div>;
  }

  return (
    <div>
      <PageHeader
        title="Vacancy Details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <Link href={`/recruitment/vacancies/${id}/edit`}>
              <Button variant="primary">
                <Edit size={18} className="mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Are you sure you want to delete this vacancy?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </Button>
          </div>
        }
      />

      <DataStates isLoading={isLoading} error={error} onRetry={refetch}>
        {vacancy && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">{vacancy.jobTitle}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        className={VACANCY_STATUS_COLORS[vacancy.status as keyof typeof VACANCY_STATUS_COLORS] || ''}
                      >
                        {vacancy.status}
                      </Badge>
                      <Badge variant="info">{vacancy.department}</Badge>
                      <Badge>{vacancy.employmentType}</Badge>
                      <Badge>{vacancy.workMode}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Vacancy Code</p>
                    <p className="font-semibold">{vacancy.vacancyCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <Users size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Applicants</p>
                    <p className="text-2xl font-bold text-navy">{applicants.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <Briefcase size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Openings</p>
                    <p className="text-2xl font-bold text-navy">{vacancy.numberOfOpenings}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-purple-50 p-3">
                    <Calendar size={24} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Application Period</p>
                    <p className="text-sm font-medium text-navy">
                      {format(new Date(vacancy.applicationStartDate), 'MMM d')} -{' '}
                      {format(new Date(vacancy.applicationEndDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>{vacancy.location || 'Remote'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience Required</p>
                    <p>{vacancy.experienceRequired || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Salary Range</p>
                    <p>
                      ₹{vacancy.salaryMin?.toLocaleString() || '0'} - ₹
                      {vacancy.salaryMax?.toLocaleString() || '0'} {vacancy.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Education Required</p>
                    <p>{vacancy.educationRequired || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills & Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Required Skills</p>
                    <p className="whitespace-pre-wrap">{vacancy.requiredSkills || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preferred Skills</p>
                    <p className="whitespace-pre-wrap">{vacancy.preferredSkills || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Job Description</p>
                    <p className="whitespace-pre-wrap text-sm">{vacancy.jobDescription || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applicants List */}
            {applicants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Applicants ({applicants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Name</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Email</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Stage</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Experience</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicants.map((applicant) => (
                          <tr key={applicant.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">
                              <Link
                                href={`/recruitment/applicants/${applicant.id}`}
                                className="text-navy hover:text-gold"
                              >
                                {applicant.fullName}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-sm">{applicant.email}</td>
                            <td className="py-2 px-3">
                              <Badge>{applicant.currentStage}</Badge>
                            </td>
                            <td className="py-2 px-3 text-sm">{applicant.totalExperience || 0} years</td>
                            <td className="py-2 px-3 text-sm">
                              {format(new Date(applicant.createdAt), 'MMM d, yyyy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DataStates>
    </div>
  );
}