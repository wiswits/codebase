import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend 
} from 'recharts';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';

const COLORS = ['#0F2147', '#C8A04E', '#9AA0A6'];

export const OccupancyWidget: React.FC = () => {
  const { user } = useAuth();
  
  const { data: occupancyData, isLoading } = useQuery({
    queryKey: ['dashboard-occupancy', user?.orgId],
    queryFn: async () => {
      const response = await apiClient.get('/occupancy/summary');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
        </div>
      </Card>
    );
  }

  const pieData = [
    { name: 'Occupied', value: occupancyData?.occupied || 0 },
    { name: 'Vacant', value: occupancyData?.vacant || 0 },
    { name: 'Blocked', value: occupancyData?.blocked || 0 },
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Occupancy Overview</h3>
          <span className="text-sm text-gray-500">
            {occupancyData?.totalStudents || 0} students
          </span>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">Occupancy Rate</p>
            <p className="text-lg font-bold text-apex-navy">
              {occupancyData?.occupancyRate || 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Available Beds</p>
            <p className="text-lg font-bold text-apex-gold">
              {occupancyData?.vacant || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Hostels</p>
            <p className="text-lg font-bold">
              {occupancyData?.totalHostels || 0}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};