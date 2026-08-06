import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaTasks, FaCalendarCheck, FaUserPlus, FaChartBar } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getAdmin();
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics fetch error:', err);
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
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Employees', value: analytics?.employeeCount || 0, icon: FaUsers, color: 'bg-blue-500' },
    { label: 'Departments', value: analytics?.departmentCount || 0, icon: FaChartBar, color: 'bg-purple-500' },
    { label: 'Present Today', value: analytics?.presentEmployees || 0, icon: FaUserPlus, color: 'bg-green-500' },
    { label: 'Tasks Completed', value: analytics?.tasksCompleted || 0, icon: FaTasks, color: 'bg-orange-500' }
  ];

  const pieData = [
    { name: 'Present', value: analytics?.presentEmployees || 0, color: '#10B981' },
    { name: 'Absent', value: analytics?.absentEmployees || 0, color: '#EF4444' }
  ];

  const monthlyData = analytics?.monthlyGrowth || [
    { month: 'Jan', employees: 45, tasks: 30 },
    { month: 'Feb', employees: 48, tasks: 35 },
    { month: 'Mar', employees: 52, tasks: 42 },
    { month: 'Apr', employees: 55, tasks: 48 },
    { month: 'May', employees: 58, tasks: 55 },
    { month: 'Jun', employees: 62, tasks: 60 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FaChartLine className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Growth</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
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
                <Line type="monotone" dataKey="employees" stroke="#4F46E5" strokeWidth={2} />
                <Line type="monotone" dataKey="tasks" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attendance Distribution</h4>
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Department Performance</h4>
        <div className="space-y-3">
          {analytics?.departmentPerformance?.slice(0, 5).map((dept, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{dept.department?.name || 'Unknown'}</span>
                <span className="text-gray-900 dark:text-white font-medium">{dept.performanceScore?.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min(dept.performanceScore || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;