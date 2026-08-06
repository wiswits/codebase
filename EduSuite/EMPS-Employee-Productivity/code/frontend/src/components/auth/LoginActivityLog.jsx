import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/authApi';
import { formatDistanceToNow } from 'date-fns';

const LoginActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoginActivity();
  }, []);

  const fetchLoginActivity = async () => {
    try {
      const response = await authApi.getLoginActivity();
      setActivities(response.data || []);
    } catch (err) {
      setError('Failed to load login activity');
      console.error('Login activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '🖥️';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return '📱';
    if (ua.includes('tablet')) return '📱';
    if (ua.includes('windows')) return '💻';
    if (ua.includes('mac')) return '💻';
    if (ua.includes('linux')) return '🐧';
    return '🖥️';
  };

  const getLocationInfo = (ip) => {
    if (!ip) return 'Unknown Location';
    if (ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
      return 'Local Network';
    }
    return `IP: ${ip}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Login Activity Log
        </h3>
        <button
          onClick={fetchLoginActivity}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No login activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl flex-shrink-0">
                {getDeviceIcon(activity.userAgent)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.ip ? getLocationInfo(activity.ip) : 'Unknown Location'}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {activity.userAgent ? (
                    <span className="truncate block">{activity.userAgent}</span>
                  ) : (
                    <span>Device information not available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginActivityLog;