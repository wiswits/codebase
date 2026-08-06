'use client';

import { useState } from 'react';
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
import { applicantService } from '@/services/applicant.service';
import { vacancyService } from '@/services/vacancy.service';
import {
  RECRUITMENT_STAGES,
  APPLICATION_SOURCES,
  GENDER_OPTIONS,
} from '@/utils/constants';
import toast from 'react-hot-toast';

const applicantSchema = z.object({
  vacancy_id: z.coerce.number().min(1, 'Vacancy is required'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().optional(),
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  alternate_phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  current_city: z.string().optional(),
  current_state: z.string().optional(),
  current_country: z.string().optional(),
  address: z.string().optional(),
  highest_qualification: z.string().optional(),
  specialization: z.string().optional(),
  university: z.string().optional(),
  graduation_year: z.coerce.number().optional(),
  total_experience: z.coerce.number().min(0).default(0),
  current_company: z.string().optional(),
  current_designation: z.string().optional(),
  current_ctc: z.coerce.number().optional(),
  expected_ctc: z.coerce.number().optional(),
  notice_period: z.coerce.number().optional(),
  resume_file: z.string().optional(),
  portfolio_url: z.string().url('Invalid URL').optional(),
  linkedin_url: z.string().url('Invalid URL').optional(),
  github_url: z.string().url('Invalid URL').optional(),
  current_stage: z.string().default('Applied'),
  application_source: z.string().default('Website'),
  application_date: z.string().optional(),
  notes: z.string().optional(),
});

type ApplicantFormData = z.infer<typeof applicantSchema>;

export default function CreateApplicantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies-dropdown'],
    queryFn: () => vacancyService.getAll({ status: 'Open', limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema) as any,
    defaultValues: {
      current_stage: 'Applied',
      application_source: 'Website',
      total_experience: 0,
    },
  });

  const watchFirstName = watch('first_name');
  const watchLastName = watch('last_name');

  // Auto-generate full name
  const fullName = `${watchFirstName || ''} ${watchLastName || ''}`.trim();

  const onSubmit = async (data: ApplicantFormData) => {
    setIsSubmitting(true);
    try {
      // Set full name if not provided
      if (!data.full_name) {
        data.full_name = fullName;
      }
      // Set application date if not provided
      if (!data.application_date) {
        data.application_date = new Date().toISOString().split('T')[0];
      }
      await applicantService.create({
  ...data,
  organization_id: 1,
  recruiter_id: 201,
}); 
      toast.success('Applicant created successfully');
      router.push('/recruitment/applicants');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Applicant"
        description="Add a new job applicant"
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
            {/* Vacancy Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Input
                label="Application Date"
                type="date"
                {...register('application_date')}
                error={errors.application_date?.message}
              />
            </div>

            {/* Personal Information */}
            <h3 className="font-semibold text-navy border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="First Name"
                {...register('first_name')}
                error={errors.first_name?.message}
              />
              <Input
                label="Last Name"
                {...register('last_name')}
                error={errors.last_name?.message}
              />
              <Input
                label="Full Name"
                {...register('full_name')}
                error={errors.full_name?.message}
                placeholder={fullName || 'Auto-generated from first and last name'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label="Alternate Phone"
                {...register('alternate_phone')}
                error={errors.alternate_phone?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Gender"
                options={[
                  { value: '', label: 'Select Gender' },
                  ...GENDER_OPTIONS.map((g) => ({ value: g, label: g })),
                ]}
                {...register('gender')}
                error={errors.gender?.message}
              />
              <Input
                label="Date of Birth"
                type="date"
                {...register('date_of_birth')}
                error={errors.date_of_birth?.message}
              />
              <Input
                label="Current City"
                {...register('current_city')}
                error={errors.current_city?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Current State"
                {...register('current_state')}
                error={errors.current_state?.message}
              />
              <Input
                label="Current Country"
                {...register('current_country')}
                error={errors.current_country?.message}
              />
            </div>

            <TextArea
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              rows={2}
            />

            {/* Education */}
            <h3 className="font-semibold text-navy border-b pb-2">Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Highest Qualification"
                {...register('highest_qualification')}
                error={errors.highest_qualification?.message}
              />
              <Input
                label="Specialization"
                {...register('specialization')}
                error={errors.specialization?.message}
              />
              <Input
                label="University"
                {...register('university')}
                error={errors.university?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Graduation Year"
                type="number"
                {...register('graduation_year')}
                error={errors.graduation_year?.message}
              />
            </div>

            {/* Experience */}
            <h3 className="font-semibold text-navy border-b pb-2">Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Total Experience (years)"
                type="number"
                step="0.5"
                {...register('total_experience')}
                error={errors.total_experience?.message}
              />
              <Input
                label="Current Company"
                {...register('current_company')}
                error={errors.current_company?.message}
              />
              <Input
                label="Current Designation"
                {...register('current_designation')}
                error={errors.current_designation?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Current CTC (₹)"
                type="number"
                {...register('current_ctc')}
                error={errors.current_ctc?.message}
              />
              <Input
                label="Expected CTC (₹)"
                type="number"
                {...register('expected_ctc')}
                error={errors.expected_ctc?.message}
              />
              <Input
                label="Notice Period (days)"
                type="number"
                {...register('notice_period')}
                error={errors.notice_period?.message}
              />
            </div>

            {/* Resume & Links */}
            <h3 className="font-semibold text-navy border-b pb-2">Resume & Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Resume File"
                {...register('resume_file')}
                error={errors.resume_file?.message}
                placeholder="resume.pdf"
              />
              <Input
                label="Portfolio URL"
                {...register('portfolio_url')}
                error={errors.portfolio_url?.message}
                placeholder="https://portfolio.com/username"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="LinkedIn URL"
                {...register('linkedin_url')}
                error={errors.linkedin_url?.message}
                placeholder="https://linkedin.com/in/username"
              />
              <Input
                label="GitHub URL"
                {...register('github_url')}
                error={errors.github_url?.message}
                placeholder="https://github.com/username"
              />
            </div>

            {/* Recruitment Details */}
            <h3 className="font-semibold text-navy border-b pb-2">Recruitment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Current Stage"
                options={RECRUITMENT_STAGES.map((s) => ({ value: s, label: s }))}
                {...register('current_stage')}
                error={errors.current_stage?.message}
              />
              <Select
                label="Application Source"
                options={APPLICATION_SOURCES.map((s) => ({ value: s, label: s }))}
                {...register('application_source')}
                error={errors.application_source?.message}
              />
            </div>

            <TextArea
              label="Notes"
              {...register('notes')}
              error={errors.notes?.message}
              rows={3}
              placeholder="Additional notes about the applicant..."
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
                Create Applicant
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}