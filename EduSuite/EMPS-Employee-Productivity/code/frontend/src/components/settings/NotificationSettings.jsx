import React, { useState } from 'react';
import { FaBell, FaEnvelope, FaMobileAlt, FaSms, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    email: {
      taskAssigned: true,
      taskDeadline: true,
      meetingReminder: true,
      leaveApproved: true,
      announcement: true,
      attendanceReminder: true
    },
    push: {
      taskAssigned: true,
      taskDeadline: true,
      meetingReminder: true,
      leaveApproved: true,
      announcement: true,
      message: true
    },
    sms: {
      taskAssigned: false,
      taskDeadline: false,
      meetingReminder: true,
      leaveApproved: false,
      announcement: false,
      attendanceReminder: false
    }
  });

  const handleToggle = (channel, key) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const channels = [
    { id: 'email', label: 'Email', icon: FaEnvelope, description: 'Receive notifications via email' },
    { id: 'push', label: 'Push', icon: FaMobileAlt, description: 'Receive push notifications on your device' },
    { id: 'sms', label: 'SMS', icon: FaSms, description: 'Receive notifications via SMS' }
  ];

  const notificationTypes = [
    { id: 'taskAssigned', label: 'Task Assigned' },
    { id: 'taskDeadline', label: 'Task Deadline' },
    { id: 'meetingReminder', label: 'Meeting Reminder' },
    { id: 'leaveApproved', label: 'Leave Approved' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'attendanceReminder', label: 'Attendance Reminder' },
    ...(settings.push ? [{ id: 'message', label: 'New Messages' }] : [])
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaBell className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Settings
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const channelSettings = settings[channel.id] || {};
            return (
              <div key={channel.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Icon className="text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {channel.label} Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notificationTypes.map((type) => (
                    <label key={type.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channelSettings[type.id] || false}
                        onChange={() => handleToggle(channel.id, type.id)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;