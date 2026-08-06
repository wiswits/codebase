import React, { useState, useEffect } from 'react';
import { FaUserCheck, FaUserTimes, FaClock, FaCheckCircle } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const MeetingAttendance = ({ meetingId }) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const response = await meetingApi.getById(meetingId);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to load meeting attendance');
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !meeting) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 dark:text-red-400">{error || 'Meeting not found'}</p>
      </div>
    );
  }

  const totalAttendees = meeting.attendees?.length || 0;
  const organizer = meeting.organizer;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <FaUserCheck className="mx-auto text-green-600 dark:text-green-400 text-xl mb-1" />
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {totalAttendees}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Attendees</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <FaClock className="mx-auto text-blue-600 dark:text-blue-400 text-xl mb-1" />
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {meeting.duration || 0}m
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <FaCheckCircle className="mx-auto text-purple-600 dark:text-purple-400 text-xl mb-1" />
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {meeting.status || 'Scheduled'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Attendees List
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {organizer && (
            <div className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {organizer.firstName} {organizer.lastName}
                </span>
                <span className="text-xs px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Organizer
                </span>
              </div>
              <FaUserCheck className="text-green-600 dark:text-green-400" />
            </div>
          )}
          {meeting.attendees?.map((attendee, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 font-semibold">
                  {attendee.firstName?.[0]}{attendee.lastName?.[0]}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {attendee.firstName} {attendee.lastName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {attendee.employeeId}
                </span>
              </div>
              <FaUserCheck className="text-green-600 dark:text-green-400" />
            </div>
          ))}
          {(!meeting.attendees || meeting.attendees.length === 0) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              No attendees added
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingAttendance;