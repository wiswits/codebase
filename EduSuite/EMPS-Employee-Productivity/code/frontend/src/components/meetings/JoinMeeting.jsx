import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaVideo, FaMicrophone, FaPhone, FaUsers, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const JoinMeeting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  useEffect(() => {
    if (meeting && meeting.meetingLink) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.open(meeting.meetingLink, '_blank');
            navigate('/meetings');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [meeting, navigate]);

  const fetchMeeting = async () => {
    try {
      const response = await meetingApi.getById(id);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to load meeting');
      console.error('Meeting fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinNow = () => {
    if (meeting?.meetingLink) {
      window.open(meeting.meetingLink, '_blank');
      navigate('/meetings');
    }
  };

  const handleCancel = () => {
    navigate('/meetings');
  };

  if (loading) return <LoadingSpinner />;

  if (error || !meeting) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error || 'Meeting not found'}</p>
        <button
          onClick={() => navigate('/meetings')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Meetings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaVideo className="text-indigo-600 dark:text-indigo-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ready to Join?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            You're about to join the meeting
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {meeting.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {meeting.description}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <FaCalendarAlt />
              <span>{format(new Date(meeting.startTime), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <FaClock />
              <span>{format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <FaUsers />
              <span>{meeting.attendees?.length || 0} attendees</span>
            </div>
            {meeting.meetingType && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <FaVideo />
                <span className="capitalize">{meeting.meetingType}</span>
              </div>
            )}
          </div>
        </div>

        {meeting.meetingLink && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Joining in {countdown} seconds...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          {meeting.meetingLink && (
            <button
              onClick={handleJoinNow}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
            >
              <FaVideo />
              <span>Join Now</span>
            </button>
          )}
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
        </div>

        {!meeting.meetingLink && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
              No meeting link available. Please contact the organizer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinMeeting;