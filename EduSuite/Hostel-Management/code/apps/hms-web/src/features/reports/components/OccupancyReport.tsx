import React, { useState, useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, Calendar, Building2, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { apiClient } from '../../../api/client';
import { usePermissions } from '../../../hooks/usePermissions';

interface OccupancyReportProps {
  hostelId: string;
}

const COLORS = ['#0F2147', '#C8A04E', '#9AA0A6', '#F7F4EC'];

export const OccupancyReport: React.FC<OccupancyReportProps> = ({ hostelId }) => {
  const { can } = usePermissions();
  const [level, setLevel] = useState<'floor' | 'wing' | 'building'>('floor');
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('month');

  const { data: occupancyData, isLoading } = useQuery({
    queryKey: ['occupancy-report', hostelId, level, period],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/occupancy`, {
        params: { hostelId, level, period },
      });
      return response.data;
    },
    enabled: !!hostelId,
  });

  const { data: trendData } = useQuery({
    queryKey: ['occupancy-trend', hostelId, period],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/occupancy/trend`, {
        params: { hostelId, period },
      });
      return response.data;
    },
    enabled: !!hostelId,
  });

  const pieData = useMemo(() => {
    if (!occupancyData) return [];
    return [
      { name: 'Occupied', value: occupancyData.occupied || 0 },
      { name: 'Vacant', value: occupancyData.vacant || 0 },
      { name: 'Reserved', value: occupancyData.reserved || 0 },
      { name: 'Blocked', value: occupancyData.blocked || 0 },
    ];
  }, [occupancyData]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await apiClient.get(`/reports/occupancy/export`, {
        params: { hostelId, level, period, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `occupancy-report.${format === 'csv' ? 'csv' : 'xlsx'}`);
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
            View By
          </label>
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            options={[
              { value: 'floor', label: 'Floor Level' },
              { value: 'wing', label: 'Wing Level' },
              { value: 'building', label: 'Building Level' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period
          </label>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            options={[
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'term', label: 'This Term' },
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
            <p className="text-sm text-gray-600">Total Beds</p>
            <p className="text-2xl font-bold">{occupancyData?.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-apex-navy">{occupancyData?.occupied || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Vacant</p>
            <p className="text-2xl font-bold text-apex-gold">{occupancyData?.vacant || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Occupancy Rate</p>
            <p className="text-2xl font-bold">
              {occupancyData?.occupancyRate || 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Occupancy Distribution</h3>
            <div className="h-80">
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Occupancy Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="occupied"
                    stroke="#0F2147"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="vacant"
                    stroke="#C8A04E"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Detailed Occupancy by {level}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Total
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Occupied
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Vacant
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {occupancyData?.details?.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-apex-ivory">
                    <td className="py-2 px-3 text-sm">{item.name}</td>
                    <td className="py-2 px-3 text-sm text-right">{item.total}</td>
                    <td className="py-2 px-3 text-sm text-right">{item.occupied}</td>
                    <td className="py-2 px-3 text-sm text-right">{item.vacant}</td>
                    <td className="py-2 px-3 text-sm text-right font-medium">
                      {item.rate}%
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