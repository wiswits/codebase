import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import { announcementApi } from '../../api/announcementApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const EmergencyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await announcementApi.getAll({ type: 'emergency', priority: 'urgent' });
      setAlerts(response.data || []);
    } catch (err) {
      setError('Failed to load emergency alerts');
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id]);
  };

  const handleAcknowledge = async (id) => {
    try {
      // Mark as acknowledged
      handleDismiss(id);
    } catch (error) {
      console.error('Acknowledge error:', error);
    }
  };

  const activeAlerts = alerts.filter(a => !dismissed.includes(a._id));

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <FaBell className="mx-auto text-gray-300 dark:text-gray-600 text-3xl mb-2" />
        <p className="text-gray-500 dark:text-gray-400">No active emergency alerts</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All clear</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => (
        <div
          key={alert._id}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
                    {alert.title}
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-full">
                    URGENT
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {alert.content}
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              <button
                onClick={() => handleAcknowledge(alert._id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaCheck size={12} />
                <span>Acknowledge</span>
              </button>
              <button
                onClick={() => handleDismiss(alert._id)}
                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmergencyAlerts;