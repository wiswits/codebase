import React, { useState, useEffect } from 'react';
import { FaTasks, FaSearch, FaFilter, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { taskApi } from '../../api/taskApi';
import { analyticsApi } from '../../api/analyticsApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { StatusBadge } from '../dashboard/DashboardWidgets';

const TeamTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, teamRes] = await Promise.all([
        taskApi.getAll(filters),
        analyticsApi.getTeam()
      ]);
      setTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data?.teamPerformance || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.assignedTo?.some(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaTasks className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Tasks</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Status</option>
            <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
          </select>
          <select onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Priority</option>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <input type="text" placeholder="Search tasks or assignees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div key={task._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">{task.title}</h4>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Assigned to: {task.assignedTo?.map(u => `${u.firstName} ${u.lastName}`).join(', ')}</span>
              <span className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 dark:text-red-400' : ''}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">{task.progress || 0}%</span>
            </div>
          </div>
        ))}
      </div>
      {filteredTasks.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>No tasks found</p></div>}
    </div>
  );
};

export default TeamTasks;