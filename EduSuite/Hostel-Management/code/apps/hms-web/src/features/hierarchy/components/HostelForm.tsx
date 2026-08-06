import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createHostelSchema, type CreateHostel, type Hostel } from '@shared/schemas/hostel';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useHostels } from '../hooks/useHostels';

interface HostelFormProps {
  initialData?: Hostel;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const HostelForm: React.FC<HostelFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { createHostel, updateHostel, isCreating, isUpdating } = useHostels();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateHostel>({
    resolver: zodResolver(createHostelSchema),
    defaultValues: initialData || {
      name: '',
      code: '',
      type: 'boys',
      rules: {},
      facilities: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: CreateHostel) => {
    try {
      if (initialData) {
        await updateHostel({ id: initialData.id, data });
      } else {
        await createHostel(data);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving hostel:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hostel Name *
          </label>
          <Input
            {...register('name')}
            placeholder="e.g., Bhagirathi Hostel"
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hostel Code *
          </label>
          <Input
            {...register('code')}
            placeholder="e.g., BH-01"
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <Select
            {...register('type')}
            options={[
              { value: 'boys', label: 'Boys' },
              { value: 'girls', label: 'Girls' },
              { value: 'coed', label: 'Co-ed' },
              { value: 'staff', label: 'Staff' },
            ]}
            error={errors.type?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <Select
            {...register('isActive')}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Facilities (comma separated)
        </label>
        <Input
          {...register('facilities')}
          placeholder="e.g., WiFi, AC, Gym, Mess"
          error={errors.facilities?.message}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          {initialData ? 'Update Hostel' : 'Create Hostel'}
        </Button>
      </div>
    </form>
  );
};