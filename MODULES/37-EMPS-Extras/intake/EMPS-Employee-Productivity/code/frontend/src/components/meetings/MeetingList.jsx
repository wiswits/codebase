import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaVideo, FaCalendarAlt, FaClock, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import { format, formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { StatusBadge } from '../dashboard/DashboardWidgets';
import { toast } from 'react-toastify';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await meetingApi.getMyMeetings();
      const allMeetings = response.data || [];
      
      const now = new Date();
      let filtered = allMeetings;
      
      if (filter === 'upcoming') {
        filtered = allMeetings.filter(m => new Date(m.startTime) > now && m.status !== 'cancelled');
      } else if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = allMeetings.filter(m => 
          new Date(m.startTime) >= today && new Date(m.startTime) < tomorrow && m.status !== 'cancelled'
        );
      } else if (filter === 'past') {
        filtered = allMeetings.filter(m => new Date(m.startTime) < now || m.status === 'completed' || m.status === 'cancelled');
      }
      
      setMeetings(filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
    } catch (err) {
      setError('Failed to load meetings');
      toast.error('Failed to load meetings');
      console.error('Meeting fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (meeting) => {
    if (meeting.meetingLink) {
      window.open(meeting.meetingLink, '_blank');
    } else {
      toast.info('No meeting link available');
    }
  };

  const getStatusColor = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    
    if (meeting.status === 'cancelled') return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    if (meeting.status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (now >= start && now <= end) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (now < start) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'today'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'past'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Past
          </button>
        </div>
        <button
          onClick={() => navigate('/meetings/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FaCalendarAlt className="mx-auto text-4xl mb-2" />
          <p className="text-lg">No {filter} meetings</p>
          <p className="text-sm mt-1">Schedule a new meeting to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {meeting.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(meeting)}`}>
                      {meeting.status || 'Scheduled'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {meeting.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <FaClock />
                      <span>{format(new Date(meeting.startTime), 'MMM dd, yyyy h:mm a')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FaUsers />
                      <span>{meeting.attendees?.length || 0} attendees</span>
                    </span>
                    {meeting.location && (
                      <span className="flex items-center space-x-1">
                        <FaMapMarkerAlt />
                        <span>{meeting.location}</span>
                      </span>
                    )}
                    {meeting.meetingType === 'virtual' && (
                      <span className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400">
                        <FaVideo />
                        <span>Virtual</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {meeting.meetingLink && new Date(meeting.startTime) <= new Date() && new Date(meeting.endTime) >= new Date() && (
                    <button
                      onClick={() => handleJoinMeeting(meeting)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FaVideo />
                      <span>Join</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/meetings/${meeting._id}`)}
                    className="px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingList;