import React, { useState, useEffect } from 'react';
import { FaChartLine, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { reportApi } from '../../api/reportApi';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ExportReport from './ExportReport';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MonthlyReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [monthOffset]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = startOfMonth(subMonths(now, monthOffset));
      const end = endOfMonth(start);

      const response = await reportApi.generate({
        type: 'monthly',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to load monthly report');
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setMonthOffset(prev => prev + delta);
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
    { week: 'Week 1', tasks: 45, attendance: 82, productivity: 78 },
    { week: 'Week 2', tasks: 52, attendance: 88, productivity: 85 },
    { week: 'Week 3', tasks: 38, attendance: 76, productivity: 72 },
    { week: 'Week 4', tasks: 60, attendance: 92, productivity: 90 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaChartLine className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Monthly Report
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => setMonthOffset(0)}
              className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
            >
              This Month
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Next
            </button>
            <ExportReport reportId={report?._id} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {report?.data?.totalTasks || 0}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {report?.metrics?.completionRate || 0}%
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Attendance</p>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {report?.metrics?.attendance || 0}%
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Productivity</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {report?.metrics?.productivity || 0}%
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#9ca3af" />
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
              <Area type="monotone" dataKey="tasks" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
              <Area type="monotone" dataKey="attendance" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;