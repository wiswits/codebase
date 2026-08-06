import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import { taskApi } from '../../api/taskApi';
import TaskCard from './TaskCard';
import TaskFilters from './TaskFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const TaskList = ({ showMyTasks = false }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    department: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [filters, sortBy]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { ...filters, sort: sortBy };
      if (searchQuery) params.search = searchQuery;
      
      const response = showMyTasks 
        ? await taskApi.getMyTasks(params)
        : await taskApi.getAll(params);
      
      setTasks(response.data || []);
    } catch (err) {
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
      console.error('Task fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleTaskUpdate = () => {
    fetchTasks();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex-1 md:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaFilter />
          </button>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Created</option>
            <option value="title">Title</option>
          </select>
        </div>
        <button
          onClick={() => navigate('/tasks/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Create Task</span>
        </button>
      </div>

      {showFilters && (
        <TaskFilters filters={filters} onFilterChange={handleFilterChange} />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">Create a new task to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={handleTaskUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
