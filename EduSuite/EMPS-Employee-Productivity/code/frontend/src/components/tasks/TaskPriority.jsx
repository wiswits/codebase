import React from 'react';
import { FaFlag } from 'react-icons/fa';

const TaskPriority = ({ priority, size = 'sm', showLabel = true }) => {
  const getPriorityConfig = (p) => {
    const configs = {
      low: {
        label: 'Low',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-700',
        border: 'border-gray-300 dark:border-gray-600',
        icon: <FaFlag className="text-gray-400" size={12} />
      },
      medium: {
        label: 'Medium',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        icon: <FaFlag className="text-blue-400" size={12} />
      },
      high: {
        label: 'High',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-300 dark:border-orange-700',
        icon: <FaFlag className="text-orange-400" size={12} />
      },
      urgent: {
        label: 'Urgent',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-300 dark:border-red-700',
        icon: <FaFlag className="text-red-400" size={12} />
      }
    };
    return configs[p] || configs.medium;
  };

  const config = getPriorityConfig(priority);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  if (!showLabel) {
    return (
      <span className={`inline-flex items-center justify-center rounded-full ${config.bg} p-1`}>
        {config.icon}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default TaskPriority;