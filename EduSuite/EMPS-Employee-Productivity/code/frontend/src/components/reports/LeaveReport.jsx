import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { reportApi } from '../../api/reportApi';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ExportReport from './ExportReport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LeaveReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await reportApi.generate({
        type: 'leave',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to load leave report');
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchReport}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'Casual', count: report?.data?.leaveByType?.casual || 0 },
    { name: 'Sick', count: report?.data?.leaveByType?.sick || 0 },
    { name: 'Emergency', count: report?.data?.leaveByType?.emergency || 0 },
    { name: 'Paid', count: report?.data?.leaveByType?.paid || 0 },
    { name: 'Half Day', count: report?.data?.leaveByType?.['half-day'] || 0 },
    { name: 'WFH', count: report?.data?.leaveByType?.['work-from-home'] || 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Leave Report
            </h2>
          </div>
          <ExportReport reportId={report?._id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Requests</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {report?.data?.totalLeaves || 0}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaCheckCircle className="text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Approved</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {report?.data?.approvedLeaves || 0}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaClock className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {report?.data?.pendingLeaves || 0}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaTimesCircle className="text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Rejected</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {report?.data?.rejectedLeaves || 0}
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LeaveReport;