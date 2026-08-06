import React, { useState, useEffect } from 'react';
import { FaTasks, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { reportApi } from '../../api/reportApi';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import ExportReport from './ExportReport';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TaskReport = () => {
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
        type: 'task-completion',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to load task report');
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

  const pieData = [
    { name: 'Completed', value: report?.data?.completedTasks || 0, color: '#10B981' },
    { name: 'In Progress', value: report?.data?.inProgressTasks || 0, color: '#3B82F6' },
    { name: 'Pending', value: report?.data?.pendingTasks || 0, color: '#F59E0B' },
    { name: 'Overdue', value: report?.data?.overdueTasks || 0, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaTasks className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Report
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
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaCheckCircle className="text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {report?.data?.completedTasks || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaClock className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">In Progress</span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {report?.data?.inProgressTasks || 0}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaClock className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {report?.data?.pendingTasks || 0}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Overdue</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              {report?.data?.overdueTasks || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Task Distribution by Priority
            </h4>
            <div className="space-y-3">
              {report?.data?.tasksByPriority && Object.entries(report.data.tasksByPriority).map(([priority, count]) => (
                <div key={priority}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{priority}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        priority === 'urgent' ? 'bg-red-500' :
                        priority === 'high' ? 'bg-orange-500' :
                        priority === 'medium' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${(count / (report?.data?.totalTasks || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskReport;