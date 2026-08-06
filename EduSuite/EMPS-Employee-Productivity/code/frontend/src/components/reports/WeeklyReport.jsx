import React, { useState, useEffect } from 'react';
import { FaChartBar, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { reportApi } from '../../api/reportApi';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ExportReport from './ExportReport';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WeeklyReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [weekOffset]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = startOfWeek(now);
      start.setDate(start.getDate() + weekOffset * 7);
      const end = endOfWeek(start);

      const response = await reportApi.generate({
        type: 'weekly',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to load weekly report');
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (delta) => {
    setWeekOffset(prev => prev + delta);
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
    { day: 'Mon', tasks: 8, attendance: 85, productivity: 75 },
    { day: 'Tue', tasks: 12, attendance: 90, productivity: 82 },
    { day: 'Wed', tasks: 10, attendance: 78, productivity: 80 },
    { day: 'Thu', tasks: 15, attendance: 95, productivity: 88 },
    { day: 'Fri', tasks: 9, attendance: 88, productivity: 92 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaChartBar className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Weekly Report
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => changeWeek(-1)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
            >
              This Week
            </button>
            <button
              onClick={() => changeWeek(1)}
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {report?.data?.completedTasks || 0}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</p>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {report?.metrics?.attendance || 0}%
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Productivity</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {report?.metrics?.productivity || 0}%
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" />
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
              <Line type="monotone" dataKey="tasks" stroke="#4F46E5" strokeWidth={2} />
              <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="productivity" stroke="#F59E0B" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;