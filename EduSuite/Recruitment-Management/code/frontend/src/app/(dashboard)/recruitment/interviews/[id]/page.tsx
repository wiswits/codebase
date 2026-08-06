'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, Clock, User, Mail, Phone, Video, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Select } from '@/components/shared/Select';
import { TextArea } from '@/components/shared/TextArea';
import { DataStates } from '@/components/shared/DataStates';
import { interviewService } from '@/services/interview.service';
import { INTERVIEW_STATUS_COLORS } from '@/utils/constants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(params.id as string);

  const { data: interview, isLoading, error, refetch } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewService.getById(id),
    enabled: !isNaN(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, feedback, rating, recommendation }: any) =>
      interviewService.updateStatus(id, status, feedback, rating, recommendation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      toast.success('Interview status updated');
    },
  });

  if (isNaN(id)) {
    return <div>Invalid interview ID</div>;
  }

  return (
    <div>
      <PageHeader
        title="Interview Details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <Link href={`/recruitment/interviews/${id}/edit`}>
              <Button variant="primary">
                <Edit size={18} className="mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <DataStates isLoading={isLoading} error={error} onRetry={refetch}>
        {interview && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">
                      {interview.applicantName}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        className={INTERVIEW_STATUS_COLORS[interview.status as keyof typeof INTERVIEW_STATUS_COLORS] || ''}
                      >
                        {interview.status}
                      </Badge>
                      <Badge variant="info">{interview.interviewType}</Badge>
                      <Badge>{interview.interviewMode}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Round {interview.interviewRound}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Update Status:</span>
                  <Select
                    options={[
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Cancelled', label: 'Cancelled' },
                      { value: 'Rescheduled', label: 'Rescheduled' },
                      { value: 'No Show', label: 'No Show' },
                    ]}
                    value={interview.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      if (status === 'Completed') {
                        const feedback = prompt('Enter feedback:');
                        const rating = prompt('Enter rating (1-5):');
                        const recommendation = prompt('Enter recommendation (Strong Hire/Hire/Hold/Reject):');
                        updateStatusMutation.mutate({
                          status,
                          feedback: feedback || undefined,
                          rating: rating ? parseFloat(rating) : undefined,
                          recommendation: recommendation || undefined,
                        });
                      } else {
                        updateStatusMutation.mutate({ status });
                      }
                    }}
                    className="w-[180px]"
                    disabled={updateStatusMutation.isPending}
                  />
                  {updateStatusMutation.isPending && (
                    <span className="text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <span>
                      {format(new Date(interview.interviewDate), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <span>
                      {interview.startTime} {interview.endTime && `- ${interview.endTime}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {interview.interviewMode === 'Online' ? (
                      <Video size={18} className="text-gray-400" />
                    ) : interview.interviewMode === 'Offline' ? (
                      <MapPin size={18} className="text-gray-400" />
                    ) : null}
                    <span>
                      {interview.interviewMode === 'Online' && interview.meetingLink ? (
                        <a href={interview.meetingLink} target="_blank" className="text-navy hover:text-gold">
                          {interview.meetingLink}
                        </a>
                      ) : interview.venue || 'TBD'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interviewer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <span className="font-medium">{interview.interviewerName}</span>
                  </div>
                  {interview.interviewerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-400" />
                      <a href={`mailto:${interview.interviewerEmail}`} className="text-navy hover:text-gold">
                        {interview.interviewerEmail}
                      </a>
                    </div>
                  )}
                  {interview.interviewerDesignation && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{interview.interviewerDesignation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Applicant Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <Link href={`/recruitment/applicants/${interview.applicantId}`}>
                      <p className="font-medium text-navy hover:text-gold">
                        {interview.applicantName}
                      </p>
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{interview.applicantEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{interview.applicantPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback (if completed) */}
            {interview.status === 'Completed' && (interview.feedback || interview.rating) && (
              <Card>
                <CardHeader>
                  <CardTitle>Interview Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interview.rating && (
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gold">{interview.rating}</span>
                        <span className="text-gray-400">/ 5</span>
                      </div>
                    </div>
                  )}
                  {interview.recommendation && (
                    <div>
                      <p className="text-sm text-gray-500">Recommendation</p>
                      <Badge
                        variant={
                          interview.recommendation === 'Strong Hire' || interview.recommendation === 'Hire'
                            ? 'success'
                            : interview.recommendation === 'Hold'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {interview.recommendation}
                      </Badge>
                    </div>
                  )}
                  {interview.feedback && (
                    <div>
                      <p className="text-sm text-gray-500">Feedback</p>
                      <p className="whitespace-pre-wrap text-sm">{interview.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {interview.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{interview.remarks}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DataStates>
    </div>
  );
}