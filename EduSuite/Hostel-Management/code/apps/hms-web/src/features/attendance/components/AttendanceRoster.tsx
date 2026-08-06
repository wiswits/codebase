import React, { useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { Check, X, Clock, AlertCircle, User, Search } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAttendance } from '../hooks/useAttendance';
import { usePermissions } from '../../../hooks/usePermissions';
import type { AttendanceStatus } from '@shared/schemas/attendance';

interface AttendanceRosterProps {
  hostelId: string;
  date: Date;
}

export const AttendanceRoster: React.FC<AttendanceRosterProps> = ({
  hostelId,
  date,
}) => {
  const { can } = usePermissions();
  const { roster, submitAttendance, isSubmitting } = useAttendance(hostelId, date);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Initialize attendance data with existing statuses
  React.useEffect(() => {
    if (roster) {
      const initial: Record<string, AttendanceStatus> = {};
      roster.forEach(student => {
        initial[student.studentId] = student.status || 'present';
      });
      setAttendanceData(initial);
    }
  }, [roster]);

  const filteredRoster = useMemo(() => {
    if (!roster) return [];
    return roster.filter(student =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roster, searchTerm]);

  const virtualizer = useVirtualizer({
    count: filteredRoster.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const getStatusButton = (studentId: string, status: AttendanceStatus) => {
    const current = attendanceData[studentId];
    return (
      <Button
        variant={current === status ? 'secondary' : 'ghost'}
        size="sm"
        className={`
          ${current === status ? 'ring-2 ring-offset-1' : ''}
          ${status === 'present' ? 'ring-green-500' : ''}
          ${status === 'absent' ? 'ring-red-500' : ''}
          ${status === 'late' ? 'ring-yellow-500' : ''}
          ${status === 'on_leave' ? 'ring-blue-500' : ''}
        `}
        onClick={() => updateStatus(studentId, status)}
      >
        {status === 'present' && <Check size={14} />}
        {status === 'absent' && <X size={14} />}
        {status === 'late' && <Clock size={14} />}
        {status === 'on_leave' && <AlertCircle size={14} />}
        <span className="ml-1 capitalize">{status}</span>
      </Button>
    );
  };

  const handleSubmit = async () => {
    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    await submitAttendance({
      hostelId,
      date: format(date, 'yyyy-MM-dd'),
      records,
    });
  };

  const allMarked = roster?.every(student => attendanceData[student.studentId]);

  if (!roster) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg">Attendance Roster</h3>
          <span className="text-sm text-gray-500">
            {roster.length} students
          </span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="p-4">
        <div 
          ref={parentRef}
          className="h-[500px] overflow-auto"
        >
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const student = filteredRoster[virtualRow.index];
                if (!student) return null;

                return (
                  <tr
                    key={student.studentId}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="border-b border-gray-100 hover:bg-apex-ivory transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-apex-navy text-white flex items-center justify-center text-xs font-semibold">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.studentName}</p>
                          <p className="text-xs text-gray-500">ID: {student.studentId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <p className="text-sm">{student.roomNumber}</p>
                      <p className="text-xs text-gray-500">Bed {student.bedLabel}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {getStatusButton(student.studentId, 'present')}
                        {getStatusButton(student.studentId, 'absent')}
                        {getStatusButton(student.studentId, 'late')}
                        {getStatusButton(student.studentId, 'on_leave')}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>On Leave</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const defaultStatus: Record<string, AttendanceStatus> = {};
                roster.forEach(student => {
                  defaultStatus[student.studentId] = 'present';
                });
                setAttendanceData(defaultStatus);
              }}
            >
              Mark All Present
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!allMarked}
            >
              Submit Attendance
            </Button>
          </div>
        </div>

        {!allMarked && (
          <div className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
            <AlertCircle size={14} />
            Please mark status for all students before submitting
          </div>
        )}
      </Card>
    </div>
  );
};