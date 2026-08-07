import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AllocationWizard } from '../components/AllocationWizard';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const Allocate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBedId = searchParams.get('bed') || undefined;
  const preselectedStudentId = searchParams.get('student') || undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-display">Allocate Bed</h1>
      </div>

      <AllocationWizard
        preselectedBedId={preselectedBedId}
        preselectedStudentId={preselectedStudentId}
        onSuccess={() => {
          // Show success notification
          navigate('/attendance');
        }}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
};