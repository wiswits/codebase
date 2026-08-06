import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaUsers, FaFlag, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { taskApi } from '../../api/taskApi';
import { toast } from 'react-toastify';
import { StatusBadge } from '../dashboard/DashboardWidgets';

const TaskCard = ({ task, onUpdate }) => {
  const navigate = useNavigate();
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(task._id);
        toast.success('Task deleted successfully');
        if (onUpdate) onUpdate();
      } catch (error) {
        toast.error('Failed to delete task');
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {task.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {task.description}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => navigate(`/tasks/${task._id}`)}
            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {isOverdue && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            Overdue
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <FaUsers size={12} />
            <span className="text-xs">
              {task.assignedTo?.length || 0} assigned
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <FaClock size={12} />
            <span className="text-xs">
              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            by {task.assignedBy?.firstName || 'Unknown'}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {task.progress || 0}%
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              task.progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${task.progress || 0}%` }}
          ></div>
        </div>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;