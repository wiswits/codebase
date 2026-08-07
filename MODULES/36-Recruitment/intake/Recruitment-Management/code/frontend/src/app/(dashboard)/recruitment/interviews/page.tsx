'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Calendar, Clock, Video, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { DataStates } from '@/components/shared/DataStates';
import { interviewService } from '@/services/interview.service';
import { INTERVIEW_TYPES, INTERVIEW_MODES, INTERVIEW_STATUS_COLORS } from '@/utils/constants';
import { format } from 'date-fns';

export default function InterviewsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['interviews', search, statusFilter],
    queryFn: () =>
      interviewService.getAll({
        interviewerName: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      }),
  });

  const interviews = data?.items || [];

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Schedule and manage interviews"
        actions={
          <Link href="/recruitment/interviews/schedule">
            <Button variant="gold">
              <Plus size={18} className="mr-2" />
              Schedule Interview
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-50">
          <Input
            placeholder="Search by interviewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-45">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
              { value: 'Rescheduled', label: 'Rescheduled' },
              { value: 'No Show', label: 'No Show' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Apply Filters
        </Button>
      </div>

      <DataStates
        isLoading={isLoading}
        error={error}
        isEmpty={interviews.length === 0}
        emptyMessage="No interviews scheduled"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((interview) => (
            <Link key={interview.id} href={`/recruitment/interviews/${interview.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-navy">{interview.applicantName}</h3>
                      <p className="text-sm text-gray-500">{interview.jobTitle}</p>
                    </div>
                    <Badge
                      className={INTERVIEW_STATUS_COLORS[interview.status as keyof typeof INTERVIEW_STATUS_COLORS] || ''}
                    >
                      {interview.status}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{format(new Date(interview.interviewDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{interview.startTime} - {interview.endTime || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-xs">
                        {interview.interviewType}
                      </Badge>
                      {interview.interviewMode === 'Online' ? (
                        <Video size={14} />
                      ) : interview.interviewMode === 'Offline' ? (
                        <MapPin size={14} />
                      ) : null}
                      <span>{interview.interviewMode}</span>
                    </div>
                    <div className="text-xs">
                      Interviewer: {interview.interviewerName}
                    </div>
                    {interview.rating && (
                      <div className="text-xs text-gold">
                        ⭐ {interview.rating}/5
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </DataStates>
    </div>
  );
}