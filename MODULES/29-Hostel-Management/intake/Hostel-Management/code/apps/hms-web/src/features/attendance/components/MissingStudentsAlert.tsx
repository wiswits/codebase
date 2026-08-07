import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, User, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAttendance } from '../hooks/useAttendance';

interface MissingStudentsAlertProps {
  hostelId: string;
  date: Date;
}

export const MissingStudentsAlert: React.FC<MissingStudentsAlertProps> = ({
  hostelId,
  date,
}) => {
  const { missingStudents, alertParents, isAlerting } = useAttendance(hostelId, date);
  const [showAlert, setShowAlert] = useState(true);

  if (!missingStudents || missingStudents.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span>All students accounted for today</span>
        </div>
      </Card>
    );
  }

  const handleAlertParents = async () => {
    await alertParents();
    setShowAlert(false);
  };

  return (
    <Card className="p-4 border-yellow-300 bg-yellow-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800">
            Missing Students Alert
          </h4>
          <p className="text-sm text-yellow-700">
            {missingStudents.length} student{missingStudents.length > 1 ? 's' : ''} not accounted for today
          </p>
          
          <div className="mt-3 space-y-2">
            {missingStudents.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between bg-white p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">{student.studentName}</span>
                  <span className="text-sm text-gray-500">Room {student.roomNumber}</span>
                </div>
                <span className="text-xs font-medium capitalize text-red-600">
                  {student.status}
                </span>
              </div>
            ))}
          </div>

          {showAlert && (
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAlertParents}
                loading={isAlerting}
              >
                <Bell size={14} className="mr-1" />
                Alert Parents
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlert(false)}
              >
                <XCircle size={14} className="mr-1" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};