import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle, FaUserPlus, FaCalendarCheck, FaTasks } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockActivities = [
      {
        id: 1,
        type: 'task',
        title: 'Task Completed',
        description: 'John Doe completed "Project Report"',
        time: new Date(Date.now() - 1000 * 60 * 5),
        user: 'John Doe'
      },
      {
        id: 2,
        type: 'attendance',
        title: 'Check In',
        description: 'Sarah Smith checked in at 9:00 AM',
        time: new Date(Date.now() - 1000 * 60 * 30),
        user: 'Sarah Smith'
      },
      {
        id: 3,
        type: 'leave',
        title: 'Leave Approved',
        description: 'Mike Johnson approved leave request',
        time: new Date(Date.now() - 1000 * 60 * 60 * 2),
        user: 'Mike Johnson'
      },
      {
        id: 4,
        type: 'user',
        title: 'New Employee',
        description: 'Alice Brown joined the company',
        time: new Date(Date.now() - 1000 * 60 * 60 * 5),
        user: 'Alice Brown'
      },
      {
        id: 5,
        type: 'task',
        title: 'Task Assigned',
        description: 'New task assigned to Development Team',
        time: new Date(Date.now() - 1000 * 60 * 60 * 8),
        user: 'Manager'
      }
    ];

    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task':
        return <FaTasks className="text-blue-500" />;
      case 'attendance':
        return <FaClock className="text-green-500" />;
      case 'leave':
        return <FaCalendarCheck className="text-purple-500" />;
      case 'user':
        return <FaUserPlus className="text-indigo-500" />;
      default:
        return <FaCheckCircle className="text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'attendance':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'leave':
        return 'bg-purple-50 dark:bg-purple-900/20';
      case 'user':
        return 'bg-indigo-50 dark:bg-indigo-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 rounded-lg ${getActivityColor(activity.type)} transition-colors`}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                by {activity.user}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;