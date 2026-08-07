import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Download, Calendar, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiClient } from '../../../api/client';
import { usePermissions } from '../../../hooks/usePermissions';

interface AttendanceReportProps {
  hostelId: string;
}

export const AttendanceReport: React.FC<AttendanceReportProps> = ({ hostelId }) => {
  const { can } = usePermissions();
  const [studentId, setStudentId] = useState<string>('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-report', hostelId, studentId, fromDate, toDate],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/attendance`, {
        params: { hostelId, studentId: studentId || undefined, from: fromDate, to: toDate },
      });
      return response.data;
    },
    enabled: !!hostelId,
  });

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await apiClient.get(`/reports/attendance/export`, {
        params: { hostelId, studentId, from: fromDate, to: toDate, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID
          </label>
          <Input
            placeholder="Search by student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          {can('hms:report:export') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download size={14} className="mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
              >
                <Download size={14} className="mr-1" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Days</p>
            <p className="text-2xl font-bold">{attendanceData?.totalDays || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-2xl font-bold text-apex-navy">{attendanceData?.present || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-bold text-red-600">{attendanceData?.absent || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-bold">
              {attendanceData?.attendanceRate || 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Daily Attendance Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#0F2147"
                    strokeWidth={2}
                    name="Present"
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#C8A04E"
                    strokeWidth={2}
                    name="Absent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Attendance Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData?.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F2147" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Records */}
      <Card>
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Attendance Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Student
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Room
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Method
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.records?.map((record: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-apex-ivory">
                    <td className="py-2 px-3 text-sm">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                    <td className="py-2 px-3 text-sm">{record.studentName}</td>
                    <td className="py-2 px-3 text-sm">{record.roomNumber}</td>
                    <td className="py-2 px-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm capitalize">{record.method}</td>
                    <td className="py-2 px-3 text-sm">
                      {record.markedAt ? format(new Date(record.markedAt), 'HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};