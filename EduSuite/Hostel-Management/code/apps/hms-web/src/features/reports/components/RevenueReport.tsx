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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { apiClient } from '../../../api/client';
import { usePermissions } from '../../../hooks/usePermissions';

interface RevenueReportProps {
  hostelId: string;
}

const COLORS = ['#0F2147', '#C8A04E', '#9AA0A6', '#F7F4EC', '#2E7D32'];

export const RevenueReport: React.FC<RevenueReportProps> = ({ hostelId }) => {
  const { can } = usePermissions();
  const [term, setTerm] = useState<string>('current');

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-report', hostelId, term],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/revenue`, {
        params: { hostelId, term },
      });
      return response.data;
    },
    enabled: !!hostelId,
  });

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await apiClient.get(`/reports/revenue/export`, {
        params: { hostelId, term, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-report.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount / 100);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Term
          </label>
          <Select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            options={[
              { value: 'current', label: 'Current Term' },
              { value: 'previous', label: 'Previous Term' },
              { value: 'year', label: 'This Year' },
              { value: 'all', label: 'All Time' },
            ]}
          />
        </div>
        <div className="flex items-end gap-2 justify-end">
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
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-apex-navy">
              {formatCurrency(revenueData?.totalRevenue || 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Collected</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueData?.collected || 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(revenueData?.pending || 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="text-2xl font-bold">
              {revenueData?.collectionRate || 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Monthly Revenue Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F2147"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="collection"
                    stroke="#C8A04E"
                    strokeWidth={2}
                    name="Collection"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-display text-lg mb-4">Revenue Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData?.distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(revenueData?.distribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Revenue Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Student
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                    Room
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Rent
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Deposits
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Damage
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Paid
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueData?.details?.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-apex-ivory">
                    <td className="py-2 px-3 text-sm">{item.studentName}</td>
                    <td className="py-2 px-3 text-sm">{item.roomNumber}</td>
                    <td className="py-2 px-3 text-sm text-right">{formatCurrency(item.rent)}</td>
                    <td className="py-2 px-3 text-sm text-right">{formatCurrency(item.deposits)}</td>
                    <td className="py-2 px-3 text-sm text-right">{formatCurrency(item.damage)}</td>
                    <td className="py-2 px-3 text-sm text-right text-green-600">
                      {formatCurrency(item.paid)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium">
                      <span className={item.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(item.balance)}
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