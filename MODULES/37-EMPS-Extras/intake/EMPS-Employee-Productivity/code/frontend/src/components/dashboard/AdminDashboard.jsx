import React, { useState, useEffect } from 'react';
import { FaUsers, FaBuilding, FaCheckCircle, FaClock, FaChartLine, FaUserPlus } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import WelcomeCard from './WelcomeCard';
import PerformanceGraph from './PerformanceGraph';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsApi.getAdmin();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
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
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.employeeCount || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Departments',
      value: stats?.departmentCount || 0,
      icon: FaBuilding,
      color: 'bg-purple-500',
      change: '+2%'
    },
    {
      title: 'Present Today',
      value: stats?.presentEmployees || 0,
      icon: FaCheckCircle,
      color: 'bg-green-500',
      change: `${stats?.attendanceRate || 0}%`
    },
    {
      title: 'Tasks Completed',
      value: stats?.tasksCompleted || 0,
      icon: FaChartLine,
      color: 'bg-orange-500',
      change: '+8%'
    }
  ];

  return (
    <div className="space-y-6">
      <WelcomeCard user={null} role="admin" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceGraph data={stats?.monthlyGrowth || []} />
        </div>
        <div>
          <QuickActions role="admin" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Department Performance
          </h3>
          <div className="space-y-4">
            {stats?.departmentPerformance?.slice(0, 5).map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full bg-${['blue','green','purple','orange','red'][index % 5]}-500`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {dept.department?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dept.employeeCount} employees
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dept.performanceScore?.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;