import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, ArrowLeft, Bed, User, Building2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StudentSelector } from './StudentSelector';
import { BedPicker } from './BedPicker';
import { useAllocation } from '../hooks/useAllocation';
import { usePermissions } from '../../../hooks/usePermissions';
import type { CreateAllocation } from '@shared/schemas/allocation';

interface AllocationWizardProps {
  preselectedBedId?: string;
  preselectedStudentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 'student' | 'bed' | 'confirm';

export const AllocationWizard: React.FC<AllocationWizardProps> = ({
  preselectedBedId,
  preselectedStudentId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { createAllocation, isCreating, error } = useAllocation();
  
  const [currentStep, setCurrentStep] = useState<Step>('student');
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(preselectedStudentId);
  const [selectedBedId, setSelectedBedId] = useState<string | undefined>(preselectedBedId);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [bedDetails, setBedDetails] = useState<any>(null);

  // Fetch student details when selected
  useEffect(() => {
    if (selectedStudentId) {
      // In real implementation, fetch from APEX student API
      setStudentDetails({
        id: selectedStudentId,
        name: 'Student Name',
        gender: 'male',
        class: '12th',
        feeClearanceFlag: true,
      });
    }
  }, [selectedStudentId]);

  // Fetch bed details when selected
  useEffect(() => {
    if (selectedBedId) {
      // In real implementation, fetch bed details
      setBedDetails({
        id: selectedBedId,
        label: 'A',
        roomNumber: '204',
        building: 'B Block',
        wing: 'North',
        floor: 2,
        rentTier: 'standard',
      });
    }
  }, [selectedBedId]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentStep('bed');
  };

  const handleBedSelect = (bedId: string) => {
    setSelectedBedId(bedId);
    setCurrentStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedStudentId || !selectedBedId) return;

    try {
      await createAllocation({
        apexStudentId: selectedStudentId,
        bedId: selectedBedId,
      });
      onSuccess?.();
      navigate('/attendance'); // Navigate to attendance after success
    } catch (err) {
      console.error('Allocation failed:', err);
    }
  };

  const canProceed = () => {
    if (currentStep === 'student') return !!selectedStudentId;
    if (currentStep === 'bed') return !!selectedBedId;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-8">
        {['student', 'bed', 'confirm'].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-semibold
                ${currentStep === step ? 'bg-apex-gold text-white' : 
                  index < ['student', 'bed', 'confirm'].indexOf(currentStep) ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {index < ['student', 'bed', 'confirm'].indexOf(currentStep) ? (
                  <Check size={16} />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`
                text-sm font-medium
                ${currentStep === step ? 'text-apex-navy' : 
                  index < ['student', 'bed', 'confirm'].indexOf(currentStep) ? 'text-green-600' : 
                  'text-gray-400'}
              `}>
                {step === 'student' ? 'Select Student' :
                 step === 'bed' ? 'Choose Bed' : 
                 'Confirm Allocation'}
              </span>
            </div>
            {index < 2 && (
              <div className={`flex-1 h-0.5 ${
                index < ['student', 'bed', 'confirm'].indexOf(currentStep) ? 
                'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {currentStep === 'student' && (
          <div>
            <h2 className="text-xl font-display mb-2">Select Student</h2>
            <p className="text-gray-600 mb-6">
              Choose a student to allocate a bed to. Only students with cleared fees can be allocated.
            </p>
            <StudentSelector
              onSelect={handleStudentSelect}
              selectedId={selectedStudentId}
            />
          </div>
        )}

        {currentStep === 'bed' && (
          <div>
            <h2 className="text-xl font-display mb-2">Choose Bed</h2>
            <p className="text-gray-600 mb-6">
              Select an available bed for {studentDetails?.name || 'the student'}.
            </p>
            <BedPicker
              onSelect={handleBedSelect}
              selectedId={selectedBedId}
              hostelId={undefined} // Will be determined by context
              gender={studentDetails?.gender}
            />
          </div>
        )}

        {currentStep === 'confirm' && (
          <div>
            <h2 className="text-xl font-display mb-2">Confirm Allocation</h2>
            <p className="text-gray-600 mb-6">
              Please review the allocation details before confirming.
            </p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-apex-ivory p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-apex-gold" />
                    <span className="font-medium">Student Details</span>
                  </div>
                  <p><strong>Name:</strong> {studentDetails?.name}</p>
                  <p><strong>Class:</strong> {studentDetails?.class}</p>
                  <p><strong>Gender:</strong> {studentDetails?.gender}</p>
                  <p className="text-sm">
                    <span className={studentDetails?.feeClearanceFlag ? 'text-green-600' : 'text-red-600'}>
                      {studentDetails?.feeClearanceFlag ? '✓ Fees Cleared' : '✗ Fees Pending'}
                    </span>
                  </p>
                </div>

                <div className="bg-apex-ivory p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed size={16} className="text-apex-gold" />
                    <span className="font-medium">Bed Details</span>
                  </div>
                  <p><strong>Bed:</strong> {bedDetails?.label}</p>
                  <p><strong>Room:</strong> {bedDetails?.roomNumber}</p>
                  <p><strong>Building:</strong> {bedDetails?.building}</p>
                  <p><strong>Rent Tier:</strong> {bedDetails?.rentTier}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="font-semibold">Error</p>
                  <p>{error.message}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('bed')}
                disabled={isCreating}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isCreating}
              >
                <X size={16} className="mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={isCreating}
              >
                <Check size={16} className="mr-2" />
                Confirm Allocation
              </Button>
            </div>
          </div>
        )}

        {/* Navigation for steps 1 and 2 */}
        {currentStep !== 'confirm' && (
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            <div>
              {currentStep === 'bed' && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('student')}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div>
              <Button
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="ml-3"
                disabled={!canProceed()}
                onClick={() => {
                  if (currentStep === 'student') setCurrentStep('bed');
                  else if (currentStep === 'bed') setCurrentStep('confirm');
                }}
              >
                {currentStep === 'student' ? 'Next: Choose Bed' : 'Review'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};