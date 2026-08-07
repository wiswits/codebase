import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserCheck, FaCalendarCheck, FaFileAlt, FaUserPlus } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import { employeeApi } from '../../api/employeeApi';
import WelcomeCard from './WelcomeCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import LoadingSpinner from '../common/LoadingSpinner';

const HRDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analytics, employees] = await Promise.all([
        analyticsApi.getAdmin(),
        employeeApi.getAll({ limit: 5, sort: '-createdAt' })
      ]);
      setStats(analytics.data);
      setRecentEmployees(employees.data || []);
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
      color: 'bg-blue-500'
    },
    {
      title: 'Present Today',
      value: stats?.presentEmployees || 0,
      icon: FaUserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Leave Requests',
      value: stats?.pendingLeaves || 0,
      icon: FaCalendarCheck,
      color: 'bg-yellow-500'
    },
    {
      title: 'Documents Pending',
      value: stats?.pendingDocuments || 0,
      icon: FaFileAlt,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <WelcomeCard user={null} role="hr" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Employees
            </h3>
            <div className="space-y-3">
              {recentEmployees.map((employee) => (
                <div key={employee._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {employee.employeeId} • {employee.position || 'No Position'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    employee.isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {recentEmployees.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No employees found
                </p>
              )}
            </div>
          </div>
        </div>
        <div>
          <QuickActions role="hr" />
        </div>
      </div>

      <RecentActivity />
    </div>
  );
};

export default HRDashboard;