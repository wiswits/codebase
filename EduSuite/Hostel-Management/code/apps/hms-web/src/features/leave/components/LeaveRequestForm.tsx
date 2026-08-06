import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, differenceInHours } from 'date-fns';
import { Calendar, Clock, User, FileText, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useLeave } from '../hooks/useLeave';
import { usePermissions } from '../../../hooks/usePermissions';
import type { CreateLeaveRequest } from '@shared/schemas/leave';

interface LeaveRequestFormProps {
  studentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  studentId,
  onSuccess,
  onCancel,
}) => {
  const { can } = usePermissions();
  const { createLeave, isCreating, error } = useLeave();
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLeaveRequest>({
    resolver: zodResolver(CreateLeaveRequest),
    defaultValues: {
      apexStudentId: studentId || '',
      reason: '',
      fromTs: new Date().toISOString(),
      toTs: addDays(new Date(), 1).toISOString(),
    },
  });

  const fromTs = watch('fromTs');
  const toTs = watch('toTs');

  const onSubmit = async (data: CreateLeaveRequest) => {
    try {
      await createLeave(data);
      onSuccess?.();
    } catch (err) {
      console.error('Error creating leave request:', err);
    }
  };

  const hoursDifference = fromTs && toTs 
    ? differenceInHours(new Date(toTs), new Date(fromTs))
    : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!studentId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student *
            </label>
            <Input
              {...register('apexStudentId')}
              placeholder="Student ID"
              error={errors.apexStudentId?.message}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Leave *
          </label>
          <Input
            {...register('reason')}
            placeholder="e.g., Family event, Medical appointment"
            error={errors.reason?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date & Time *
          </label>
          <Input
            type="datetime-local"
            {...register('fromTs')}
            error={errors.fromTs?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date & Time *
          </label>
          <Input
            type="datetime-local"
            {...register('toTs')}
            error={errors.toTs?.message}
          />
        </div>
      </div>

      {hoursDifference > 0 && (
        <div className="bg-apex-ivory p-3 rounded-lg flex items-center gap-2">
          <Clock size={16} className="text-apex-gold" />
          <span className="text-sm">
            Duration: <strong>{hoursDifference} hours</strong> 
            ({Math.ceil(hoursDifference / 24)} days)
          </span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Leave Request Process</p>
          <ul className="list-disc list-inside mt-1 text-xs">
            <li>Leave requests require {can('hms:leave:approve') ? 'warden' : 'parent and warden'} approval</li>
            <li>You'll receive a gate pass QR code upon approval</li>
            <li>Scan your gate pass at exit and entry gates</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isCreating}
          disabled={!fromTs || !toTs || hoursDifference <= 0}
        >
          Submit Leave Request
        </Button>
      </div>
    </form>
  );
};