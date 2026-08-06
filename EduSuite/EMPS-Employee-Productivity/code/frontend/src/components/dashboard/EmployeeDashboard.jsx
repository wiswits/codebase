import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaClock, FaCalendarCheck, FaChartLine } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import { attendanceApi } from '../../api/attendanceApi';
import { taskApi } from '../../api/taskApi';
import WelcomeCard from './WelcomeCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import LoadingSpinner from '../common/LoadingSpinner';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analytics, attendance, tasksRes] = await Promise.all([
        analyticsApi.getEmployee(),
        attendanceApi.getStats(),
        taskApi.getMyTasks({ limit: 5 })  // ← Use getMyTasks for employees
      ]);
      setStats(analytics.data);
      setAttendanceStats(attendance.data);
      setTasks(tasksRes.data || []);
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
      title: 'Attendance Rate',
      value: `${Math.round(stats?.attendanceRate || 0)}%`,
      icon: FaClock,
      color: 'bg-blue-500'
    },
    {
      title: 'Tasks Completed',
      value: stats?.tasksCompleted || 0,
      icon: FaCheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Leave Balance',
      value: `${attendanceStats?.leaveBalance || 0} days`,
      icon: FaCalendarCheck,
      color: 'bg-purple-500'
    },
    {
      title: 'Productivity Score',
      value: `${Math.round(stats?.productivityScore || 0)}%`,
      icon: FaChartLine,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <WelcomeCard user={null} role="employee" />

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
              My Recent Tasks
            </h3>
            {tasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No tasks assigned
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <QuickActions role="employee" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Attendance
          </h3>
          {attendanceStats?.recentAttendance?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No attendance records
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceStats?.recentAttendance?.slice(0, 5).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {record.status || 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <RecentActivity />
      </div>
    </div>
  );
};

export default EmployeeDashboard;