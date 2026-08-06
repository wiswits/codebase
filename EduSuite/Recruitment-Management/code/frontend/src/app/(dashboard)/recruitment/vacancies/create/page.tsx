'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { TextArea } from '@/components/shared/TextArea';
import { vacancyService } from '@/services/vacancy.service';
import {
  VACANCY_STATUSES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
} from '@/utils/constants';
import toast from 'react-hot-toast';

const vacancySchema = z.object({
  vacancy_code: z.string().min(3, 'Vacancy code is required'),
  job_title: z.string().min(3, 'Job title is required'),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().optional(),
  employment_type: z.string().min(1, 'Employment type is required'),
  work_mode: z.string().min(1, 'Work mode is required'),
  location: z.string().optional(),
  number_of_openings: z.number().min(1, 'At least 1 opening required'),
  experience_required: z.string().optional(),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  job_description: z.string().optional(),
  required_skills: z.string().optional(),
  preferred_skills: z.string().optional(),
  education_required: z.string().optional(),
  application_start_date: z.string().min(1, 'Start date is required'),
  application_end_date: z.string().min(1, 'End date is required'),
  expected_joining_date: z.string().optional(),
  status: z.string().default('Draft'),
  remarks: z.string().optional(),
});

type VacancyFormData = z.infer<typeof vacancySchema>;

export default function CreateVacancyPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VacancyFormData>({
    resolver: zodResolver(vacancySchema) as any,
    defaultValues: {
      status: 'Draft',
      currency: 'INR',
      number_of_openings: 1,
    },
  });

  const watchSalaryMin = watch('salary_min');

  const onSubmit = async (data: VacancyFormData) => {
    try {
      await vacancyService.create(data);
      toast.success('Vacancy created successfully');
      router.push('/recruitment/vacancies');
    } catch (error) {
      // Error handled by interceptor
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Vacancy"
        description="Add a new job vacancy"
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
              <Input
                label="Vacancy Code"
                {...register('vacancy_code')}
                error={errors.vacancy_code?.message}
                placeholder="VAC-001"
              />
              <Input
                label="Job Title"
                {...register('job_title')}
                error={errors.job_title?.message}
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Department"
                {...register('department')}
                error={errors.department?.message}
                placeholder="Engineering"
              />
              <Input
                label="Designation"
                {...register('designation')}
                error={errors.designation?.message}
                placeholder="SDE-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Employment Type"
                options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
                {...register('employment_type')}
                error={errors.employment_type?.message}
              />
              <Select
                label="Work Mode"
                options={WORK_MODES.map((m) => ({ value: m, label: m }))}
                {...register('work_mode')}
                error={errors.work_mode?.message}
              />
              <Input
                label="Location"
                {...register('location')}
                error={errors.location?.message}
                placeholder="Delhi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Openings"
                type="number"
                {...register('number_of_openings', { valueAsNumber: true })}
                error={errors.number_of_openings?.message}
              />
              <Input
                label="Experience Required"
                {...register('experience_required')}
                placeholder="3+ Years"
                error={errors.experience_required?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Salary Min (₹)"
                type="number"
                {...register('salary_min', { valueAsNumber: true })}
                error={errors.salary_min?.message}
              />
              <Input
                label="Salary Max (₹)"
                type="number"
                {...register('salary_max', { valueAsNumber: true })}
                error={errors.salary_max?.message}
              />
              <Input
                label="Currency"
                {...register('currency')}
                error={errors.currency?.message}
                placeholder="INR"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Application Start Date"
                type="date"
                {...register('application_start_date')}
                error={errors.application_start_date?.message}
              />
              <Input
                label="Application End Date"
                type="date"
                {...register('application_end_date')}
                error={errors.application_end_date?.message}
              />
              <Input
                label="Expected Joining Date"
                type="date"
                {...register('expected_joining_date')}
                error={errors.expected_joining_date?.message}
              />
            </div>

            <TextArea
              label="Job Description"
              {...register('job_description')}
              error={errors.job_description?.message}
              rows={4}
              placeholder="Describe the role and responsibilities..."
            />

            <TextArea
              label="Required Skills"
              {...register('required_skills')}
              error={errors.required_skills?.message}
              rows={2}
              placeholder="Node.js, React, TypeScript"
            />

            <TextArea
              label="Preferred Skills"
              {...register('preferred_skills')}
              error={errors.preferred_skills?.message}
              rows={2}
              placeholder="AWS, Docker, Kubernetes"
            />

            <Input
              label="Education Required"
              {...register('education_required')}
              error={errors.education_required?.message}
              placeholder="B.Tech in Computer Science"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={VACANCY_STATUSES.map((s) => ({ value: s, label: s }))}
                {...register('status')}
                error={errors.status?.message}
              />
              <TextArea
                label="Remarks"
                {...register('remarks')}
                error={errors.remarks?.message}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

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
                Create Vacancy
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}