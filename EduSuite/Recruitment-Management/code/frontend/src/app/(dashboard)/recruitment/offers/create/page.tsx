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
import { offerService } from '@/services/offer.service';
import { applicantService } from '@/services/applicant.service';
import { vacancyService } from '@/services/vacancy.service';
import { EMPLOYMENT_TYPES, WORK_MODES, OFFER_STATUSES } from '@/utils/constants';
import toast from 'react-hot-toast';

const offerSchema = z.object({
  applicant_id: z.coerce.number().min(1, 'Applicant is required'),
  vacancy_id: z.coerce.number().min(1, 'Vacancy is required'),
  offer_reference: z.string().min(3, 'Offer reference is required'),
  offer_date: z.string().min(1, 'Offer date is required'),
  joining_date: z.string().optional(),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().optional(),
  employment_type: z.string().min(1, 'Employment type is required'),
  work_mode: z.string().min(1, 'Work mode is required'),
  work_location: z.string().optional(),
  salary: z.coerce.number().min(1, 'Salary is required'),
  bonus: z.coerce.number().optional(),
  probation_months: z.coerce.number().optional(),
  reporting_manager: z.string().optional(),
  offer_document: z.string().optional(),
  status: z.string().default('Draft'),
  remarks: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

export default function CreateOfferPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema) as any,
    defaultValues: {
      status: 'Draft',
      employment_type: 'Full Time',
      work_mode: 'On Site',
    },
  });

  const { data: applicants } = useQuery({
    queryKey: ['applicants-dropdown'],
    queryFn: () => applicantService.getAll({ limit: 500 }),
  });

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies-dropdown'],
    queryFn: () => vacancyService.getAll({ limit: 100 }),
  });

  const onSubmit = async (data: OfferFormData) => {
    try {
      await offerService.create(data);
      toast.success('Offer created successfully');
      router.push('/recruitment/offers');
    } catch (error) {
      // Error handled by interceptor
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Offer"
        description="Create a new offer letter"
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
                label="Offer Reference"
                {...register('offer_reference')}
                error={errors.offer_reference?.message}
                placeholder="OFF-001"
              />
              <Input
                label="Offer Date"
                type="date"
                {...register('offer_date')}
                error={errors.offer_date?.message}
              />
              <Input
                label="Joining Date"
                type="date"
                {...register('joining_date')}
                error={errors.joining_date?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Designation"
                {...register('designation')}
                error={errors.designation?.message}
              />
              <Input
                label="Department"
                {...register('department')}
                error={errors.department?.message}
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
                label="Work Location"
                {...register('work_location')}
                error={errors.work_location?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Salary (₹)"
                type="number"
                {...register('salary')}
                error={errors.salary?.message}
              />
              <Input
                label="Bonus (₹)"
                type="number"
                {...register('bonus')}
                error={errors.bonus?.message}
              />
              <Input
                label="Probation (months)"
                type="number"
                {...register('probation_months')}
                error={errors.probation_months?.message}
              />
            </div>

            <Input
              label="Reporting Manager"
              {...register('reporting_manager')}
              error={errors.reporting_manager?.message}
            />

            <Input
              label="Offer Document"
              {...register('offer_document')}
              error={errors.offer_document?.message}
              placeholder="offer_letter.pdf"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={OFFER_STATUSES.map((s) => ({ value: s, label: s }))}
                {...register('status')}
                error={errors.status?.message}
              />
              <TextArea
                label="Remarks"
                {...register('remarks')}
                error={errors.remarks?.message}
                rows={2}
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
                Create Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}