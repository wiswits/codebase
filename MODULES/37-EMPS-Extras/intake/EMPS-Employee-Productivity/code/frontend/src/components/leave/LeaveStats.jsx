import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCalendarCheck, FaClock, FaChartLine } from 'react-icons/fa';
import { leaveApi } from '../../api/leaveApi';
import LoadingSpinner from '../common/LoadingSpinner';

const LeaveStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await leaveApi.getAll();
      const leaves = response.data || [];
      
      const statsData = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        cancelled: leaves.filter(l => l.status === 'cancelled').length,
        byType: {
          casual: leaves.filter(l => l.type === 'casual').length,
          sick: leaves.filter(l => l.type === 'sick').length,
          emergency: leaves.filter(l => l.type === 'emergency').length,
          paid: leaves.filter(l => l.type === 'paid').length,
          'half-day': leaves.filter(l => l.type === 'half-day').length,
          'work-from-home': leaves.filter(l => l.type === 'work-from-home').length
        },
        totalDays: leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0)
      };

      setStats(statsData);
    } catch (err) {
      setError('Failed to load leave statistics');
      console.error('Leave stats error:', err);
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

  const statCards = [
    {
      title: 'Total Leaves',
      value: stats?.total || 0,
      icon: FaChartBar,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Requests',
      value: stats?.pending || 0,
      icon: FaClock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Approved Leaves',
      value: stats?.approved || 0,
      icon: FaCalendarCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Total Days',
      value: stats?.totalDays || 0,
      icon: FaChartLine,
      color: 'bg-purple-500'
    }
  ];

  const typeLabels = {
    casual: 'Casual',
    sick: 'Sick',
    emergency: 'Emergency',
    paid: 'Paid',
    'half-day': 'Half Day',
    'work-from-home': 'WFH'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-full text-white`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Leave by Type
          </h4>
          <div className="space-y-3">
            {Object.entries(stats?.byType || {}).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {typeLabels[type] || type}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Leave Status Distribution
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Approved</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {stats?.approved || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${(stats?.approved / (stats?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {stats?.pending || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-yellow-500 h-1.5 rounded-full"
                  style={{ width: `${(stats?.pending / (stats?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Rejected</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {stats?.rejected || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${(stats?.rejected / (stats?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveStats;