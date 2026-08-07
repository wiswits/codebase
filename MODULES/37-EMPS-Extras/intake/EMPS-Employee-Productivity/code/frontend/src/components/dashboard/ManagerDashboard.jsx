import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaClock, FaChartLine, FaUserCheck } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import WelcomeCard from './WelcomeCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import LoadingSpinner from '../common/LoadingSpinner';

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsApi.getTeam();
      setStats(response.data);
      setTeamMembers(response.data?.teamPerformance || []);
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
      title: 'Team Members',
      value: stats?.teamSize || 0,
      icon: FaUsers,
      color: 'bg-blue-500'
    },
    {
      title: 'Team Attendance',
      value: `${stats?.teamAttendance?.present || 0}%`,
      icon: FaUserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Tasks Completed',
      value: stats?.teamTasks?.completed || 0,
      icon: FaCheckCircle,
      color: 'bg-purple-500'
    },
    {
      title: 'Team Productivity',
      value: `${stats?.teamPerformance?.reduce((sum, p) => sum + p.productivity, 0) / (stats?.teamPerformance?.length || 1)}%`,
      icon: FaChartLine,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <WelcomeCard user={null} role="manager" />

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
              Team Performance
            </h3>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {member.employee?.firstName?.[0]}{member.employee?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.employee?.firstName} {member.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.employee?.position || 'Employee'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-block mr-2">
                        ✅ {member.tasks?.completed || 0}
                      </span>
                      <span className="inline-block">
                        📋 {member.tasks?.pending || 0}
                      </span>
                    </div>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(member.productivity || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(member.productivity || 0)}%
                    </span>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No team members found
                </p>
              )}
            </div>
          </div>
        </div>
        <div>
          <QuickActions role="manager" />
        </div>
      </div>

      <RecentActivity />
    </div>
  );
};

export default ManagerDashboard;