import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Filter } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { apiClient } from '../../../api/client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ROOM_TYPES } from '../../../lib/constants';

interface VacancyReportProps {
  hostelId: string;
}

export const VacancyReport: React.FC<VacancyReportProps> = ({ hostelId }) => {
  const { can } = usePermissions();
  const [roomType, setRoomType] = useState<string>('all');
  const [gender, setGender] = useState<string>('all');

  const { data: vacancyData, isLoading } = useQuery({
    queryKey: ['vacancy-report', hostelId, roomType, gender],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/vacancy`, {
        params: { hostelId, roomType: roomType === 'all' ? undefined : roomType, gender: gender === 'all' ? undefined : gender },
      });
      return response.data;
    },
    enabled: !!hostelId,
  });

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await apiClient.get(`/reports/vacancy/export`, {
        params: { hostelId, roomType, gender, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vacancy-report.${format === 'csv' ? 'csv' : 'xlsx'}`);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Type
          </label>
          <Select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              ...Object.entries(ROOM_TYPES).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <Select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: 'all', label: 'All Genders' },
              { value: 'boys', label: 'Boys' },
              { value: 'girls', label: 'Girls' },
            ]}
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
            <p className="text-sm text-gray-600">Total Rooms</p>
            <p className="text-2xl font-bold">{vacancyData?.totalRooms || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Beds</p>
            <p className="text-2xl font-bold">{vacancyData?.totalBeds || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Available Beds</p>
            <p className="text-2xl font-bold text-apex-gold">{vacancyData?.availableBeds || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Availability Rate</p>
            <p className="text-2xl font-bold">
              {vacancyData?.availabilityRate || 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Vacancy by Room Type</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vacancyData?.byRoomType || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#0F2147" name="Total" />
                  <Bar dataKey="available" fill="#C8A04E" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Vacancy by Floor</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vacancyData?.byFloor || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="floor" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#0F2147" name="Total" />
                  <Bar dataKey="available" fill="#C8A04E" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Room List */}
      <Card>
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Available Rooms</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Room
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Floor
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Total Beds
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Available
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {vacancyData?.availableRooms?.map((room: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-apex-ivory">
                    <td className="py-2 px-3 text-sm font-medium">{room.roomNumber}</td>
                    <td className="py-2 px-3 text-sm capitalize">{room.roomType}</td>
                    <td className="py-2 px-3 text-sm">Floor {room.floorNumber}</td>
                    <td className="py-2 px-3 text-sm text-right">{room.totalBeds}</td>
                    <td className="py-2 px-3 text-sm text-right">{room.availableBeds}</td>
                    <td className="py-2 px-3 text-sm text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.availableBeds > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {room.availableBeds > 0 ? 'Available' : 'Full'}
                      </span>
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