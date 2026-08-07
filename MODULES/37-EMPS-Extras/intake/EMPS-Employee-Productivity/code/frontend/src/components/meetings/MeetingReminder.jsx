import React, { useState, useEffect } from 'react';
import { FaBell, FaClock, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import { format, formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';

const MeetingReminder = () => {
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    fetchUpcomingMeetings();
  }, []);

  const fetchUpcomingMeetings = async () => {
    try {
      const response = await meetingApi.getMyMeetings();
      const now = new Date();
      const upcoming = (response.data || [])
        .filter(m => new Date(m.startTime) > now && m.status !== 'cancelled')
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 5);
      setUpcomingMeetings(upcoming);
    } catch (error) {
      console.error('Fetch meetings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id]);
  };

  const getTimeRemaining = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;
    
    if (diff < 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) return <LoadingSpinner />;

  const visibleMeetings = upcomingMeetings.filter(m => !dismissed.includes(m._id));

  if (visibleMeetings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <FaBell className="mx-auto text-gray-300 dark:text-gray-600 text-3xl mb-2" />
        <p className="text-gray-500 dark:text-gray-400">No upcoming meetings</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You're all set!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Meetings
        </h3>
        <FaBell className="text-indigo-600 dark:text-indigo-400" />
      </div>

      <div className="space-y-3">
        {visibleMeetings.map((meeting) => (
          <div
            key={meeting._id}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {meeting.title}
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {getTimeRemaining(meeting.startTime)}
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <FaCalendarAlt size={10} />
                    <span>{format(new Date(meeting.startTime), 'MMM dd')}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FaClock size={10} />
                    <span>{format(new Date(meeting.startTime), 'h:mm a')}</span>
                  </span>
                  <span>{meeting.attendees?.length || 0} attendees</span>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(meeting._id)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Dismiss"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {upcomingMeetings.length > 5 && (
        <button
          onClick={() => window.location.href = '/meetings'}
          className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          View all meetings
        </button>
      )}
    </div>
  );
};

export default MeetingReminder;