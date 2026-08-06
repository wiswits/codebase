'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, FileText, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { DataStates } from '@/components/shared/DataStates';
import { Select } from '@/components/shared/Select';
import { applicantService } from '@/services/applicant.service';
import { interviewService } from '@/services/interview.service';
import { offerService } from '@/services/offer.service';
import { RECRUITMENT_STAGES, STAGE_COLORS } from '@/utils/constants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(params.id as string);

  const { data: applicant, isLoading, error, refetch } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantService.getById(id),
    enabled: !isNaN(id),
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews-by-applicant', id],
    queryFn: () => interviewService.getByApplicant(id),
    enabled: !isNaN(id),
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers-by-applicant', id],
    queryFn: () => offerService.getByApplicant(id),
    enabled: !isNaN(id),
  });

  const stageMutation = useMutation({
    mutationFn: ({ stage, remarks }: { stage: string; remarks?: string }) =>
      applicantService.changeStage(id, stage, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      toast.success('Stage updated successfully');
    },
  });

  if (isNaN(id)) {
    return <div>Invalid applicant ID</div>;
  }

  return (
    <div>
      <PageHeader
        title="Applicant Details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <Link href={`/recruitment/applicants/${id}/edit`}>
              <Button variant="primary">
                <Edit size={18} className="mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <DataStates isLoading={isLoading} error={error} onRetry={refetch}>
        {applicant && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">{applicant.fullName}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={STAGE_COLORS[applicant.currentStage] || ''}>
                        {applicant.currentStage}
                      </Badge>
                      <Badge variant={applicant.status === 'Active' ? 'success' : 'default'}>
                        {applicant.status}
                      </Badge>
                      {applicant.jobTitle && (
                        <Badge variant="info">{applicant.jobTitle}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Applicant Code</p>
                    <p className="font-semibold">{applicant.applicantCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Stage */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Change Stage:</span>
                  <Select
                    options={RECRUITMENT_STAGES.map((s) => ({ value: s, label: s }))}
                    value={applicant.currentStage}
                    onChange={(e) => {
                      const stage = e.target.value;
                      const remarks = prompt('Optional remarks:');
                      stageMutation.mutate({ stage, remarks: remarks || undefined });
                    }}
                    className="w-50"
                    disabled={stageMutation.isPending}
                  />
                  {stageMutation.isPending && (
                    <span className="text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact & Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <a href={`mailto:${applicant.email}`} className="text-navy hover:text-gold">
                      {applicant.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <a href={`tel:${applicant.phone}`} className="text-navy hover:text-gold">
                      {applicant.phone}
                    </a>
                  </div>
                  {applicant.alternatePhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-400" />
                      <span>{applicant.alternatePhone} (Alternate)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400" />
                    <span>
                      {applicant.currentCity || 'N/A'}, {applicant.currentState || ''}{' '}
                      {applicant.currentCountry || ''}
                    </span>
                  </div>
                  {applicant.portfolioUrl && (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <a href={applicant.portfolioUrl} target="_blank" className="text-navy hover:text-gold">
                        Portfolio
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {applicant.currentCompany && (
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-gray-400" />
                      <span>
                        {applicant.currentDesignation} at {applicant.currentCompany}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <GraduationCap size={18} className="text-gray-400" />
                    <span>
                      {applicant.highestQualification || 'N/A'}{' '}
                      {applicant.specialization && `(${applicant.specialization})`}
                    </span>
                  </div>
                  {applicant.totalExperience > 0 && (
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-gray-400" />
                      <span>{applicant.totalExperience} years of experience</span>
                    </div>
                  )}
                  {applicant.noticePeriod > 0 && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-gray-400" />
                      <span>{applicant.noticePeriod} days notice period</span>
                    </div>
                  )}
                  {applicant.currentCTC && applicant.expectedCTC && (
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <span>
                        ₹{applicant.currentCTC.toLocaleString()} → ₹{applicant.expectedCTC.toLocaleString()} (Expected)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resume */}
            {applicant.resumeFile && (
              <Card>
                <CardHeader>
                  <CardTitle>Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={applicant.resumeFile}
                    target="_blank"
                    className="text-navy hover:text-gold flex items-center gap-2"
                  >
                    <FileText size={18} />
                    Download Resume
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {applicant.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">{applicant.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Interviews */}
            {interviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interviews ({interviews.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Type</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Date</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Interviewer</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interviews.map((interview) => (
                          <tr key={interview.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 text-sm">{interview.interviewType}</td>
                            <td className="py-2 px-3 text-sm">
                              {format(new Date(interview.interviewDate), 'MMM d, yyyy')}
                              <br />
                              <span className="text-xs text-gray-400">{interview.startTime}</span>
                            </td>
                            <td className="py-2 px-3 text-sm">{interview.interviewerName}</td>
                            <td className="py-2 px-3">
                              <Badge>{interview.status}</Badge>
                            </td>
                            <td className="py-2 px-3 text-sm">
                              {interview.rating ? `${interview.rating}/5` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Offers */}
            {offers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Offers ({offers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Reference</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Designation</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Salary</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map((offer) => (
                          <tr key={offer.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 text-sm font-medium">{offer.offerReference}</td>
                            <td className="py-2 px-3 text-sm">{offer.designation}</td>
                            <td className="py-2 px-3 text-sm">₹{offer.salary.toLocaleString()}</td>
                            <td className="py-2 px-3">
                              <Badge
                                variant={
                                  offer.status === 'Accepted'
                                    ? 'success'
                                    : offer.status === 'Rejected'
                                    ? 'danger'
                                    : offer.status === 'Sent'
                                    ? 'info'
                                    : 'default'
                                }
                              >
                                {offer.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-sm">
                              {format(new Date(offer.offerDate), 'MMM d, yyyy')}
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