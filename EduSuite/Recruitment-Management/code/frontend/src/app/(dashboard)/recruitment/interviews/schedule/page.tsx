'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { TextArea } from '@/components/shared/TextArea';
import { interviewService } from '@/services/interview.service';
import { applicantService } from '@/services/applicant.service';
import { vacancyService } from '@/services/vacancy.service';
import { INTERVIEW_TYPES, INTERVIEW_MODES } from '@/utils/constants';
import toast from 'react-hot-toast';

const interviewSchema = z.object({
  applicant_id: z.coerce.number().min(1, 'Applicant is required'),
  vacancy_id: z.coerce.number().min(1, 'Vacancy is required'),
  interview_round: z.coerce.number().min(1).default(1),
  interview_type: z.string().min(1, 'Interview type is required'),
  interview_mode: z.string().min(1, 'Interview mode is required'),
  interview_date: z.string().min(1, 'Interview date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  meeting_link: z.string().url('Invalid URL').optional(),
  interviewer_name: z.string().min(2, 'Interviewer name is required'),
  interviewer_email: z.string().email('Invalid email').optional(),
  interviewer_designation: z.string().optional(),
  remarks: z.string().optional(),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

export default function ScheduleInterviewPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema) as any,
    defaultValues: {
      interview_round: 1,
    },
  });

  const watchApplicantId = watch('applicant_id');

  const { data: applicants } = useQuery({
    queryKey: ['applicants-dropdown'],
    queryFn: () => applicantService.getAll({ limit: 500 }),
  });

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies-dropdown'],
    queryFn: () => vacancyService.getAll({ limit: 100 }),
  });

  const onSubmit = async (data: InterviewFormData) => {
    try {
      await interviewService.create(data);
      toast.success('Interview scheduled successfully');
      router.push('/recruitment/interviews');
    } catch (error) {
      // Error handled by interceptor
    }
  };

  return (
    <div>
      <PageHeader
        title="Schedule Interview"
        description="Schedule a new interview"
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Applicant"
                options={[
                  { value: '', label: 'Select Applicant' },
                  ...(applicants?.items || []).map((a) => ({
                    value: String(a.id),
                    label: `${a.fullName} (${a.email})`,
                  })),
                ]}
                {...register('applicant_id')}
                error={errors.applicant_id?.message}
              />
              <Select
                label="Vacancy"
                options={[
                  { value: '', label: 'Select Vacancy' },
                  ...(vacancies?.items || []).map((v) => ({
                    value: String(v.id),
                    label: `${v.jobTitle} (${v.vacancyCode})`,
                  })),
                ]}
                {...register('vacancy_id')}
                error={errors.vacancy_id?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Interview Round"
                type="number"
                {...register('interview_round')}
                error={errors.interview_round?.message}
              />
              <Select
                label="Interview Type"
                options={INTERVIEW_TYPES.map((t) => ({ value: t, label: t }))}
                {...register('interview_type')}
                error={errors.interview_type?.message}
              />
              <Select
                label="Interview Mode"
                options={INTERVIEW_MODES.map((m) => ({ value: m, label: m }))}
                {...register('interview_mode')}
                error={errors.interview_mode?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Interview Date"
                type="date"
                {...register('interview_date')}
                error={errors.interview_date?.message}
              />
              <Input
                label="Start Time"
                type="time"
                {...register('start_time')}
                error={errors.start_time?.message}
              />
              <Input
                label="End Time"
                type="time"
                {...register('end_time')}
                error={errors.end_time?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Venue"
                {...register('venue')}
                error={errors.venue?.message}
                placeholder="Conference Room A"
              />
              <Input
                label="Meeting Link"
                {...register('meeting_link')}
                error={errors.meeting_link?.message}
                placeholder="https://meet.google.com/xxx"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Interviewer Name"
                {...register('interviewer_name')}
                error={errors.interviewer_name?.message}
              />
              <Input
                label="Interviewer Email"
                type="email"
                {...register('interviewer_email')}
                error={errors.interviewer_email?.message}
              />
              <Input
                label="Interviewer Designation"
                {...register('interviewer_designation')}
                error={errors.interviewer_designation?.message}
              />
            </div>

            <TextArea
              label="Remarks"
              {...register('remarks')}
              error={errors.remarks?.message}
              rows={3}
              placeholder="Additional notes about the interview..."
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                isLoading={isSubmitting}
              >
                Schedule Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}