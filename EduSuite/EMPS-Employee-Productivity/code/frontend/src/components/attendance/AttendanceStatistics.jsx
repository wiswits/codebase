import React, { useState, useEffect } from 'react';
import { FaChartPie, FaChartLine, FaCalendarCheck, FaClock } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AttendanceStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await attendanceApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load attendance statistics');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'Present', value: stats?.present || 0, color: '#10B981' },
    { name: 'Late', value: stats?.late || 0, color: '#F59E0B' },
    { name: 'Absent', value: stats?.absent || 0, color: '#EF4444' },
    { name: 'Half Day', value: stats?.halfDay || 0, color: '#3B82F6' },
    { name: 'On Leave', value: stats?.onLeave || 0, color: '#8B5CF6' },
  ];

  const totalDays = pieData.reduce((sum, item) => sum + item.value, 0) || 1;

  const statCards = [
    {
      title: 'Present Days',
      value: stats?.present || 0,
      percentage: ((stats?.present || 0) / totalDays * 100).toFixed(1),
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Late Days',
      value: stats?.late || 0,
      percentage: ((stats?.late || 0) / totalDays * 100).toFixed(1),
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Absent Days',
      value: stats?.absent || 0,
      percentage: ((stats?.absent || 0) / totalDays * 100).toFixed(1),
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Working Hours',
      value: `${stats?.totalWorkingHours || 0}h`,
      percentage: `${stats?.averageWorkingHours || 0}h avg`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className={`${card.bg} rounded-lg p-4`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
            <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{card.percentage}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Attendance Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Summary
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FaCalendarCheck className="text-indigo-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Days</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalDays}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FaClock className="text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Working Hours</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats?.totalWorkingHours || 0}h
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FaChartLine className="text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Attendance Rate</span>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {((stats?.present || 0) / totalDays * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <FaChartPie className="text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Overtime</span>
              </div>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {stats?.totalOvertime || 0}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatistics;