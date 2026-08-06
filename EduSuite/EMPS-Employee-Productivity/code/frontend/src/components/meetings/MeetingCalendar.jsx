import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaPlus, FaVideo } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';

const MeetingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMonthMeetings();
  }, [currentDate]);

  const fetchMonthMeetings = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const response = await meetingApi.getMyMeetings();
      const allMeetings = response.data || [];

      const meetingMap = {};
      allMeetings.forEach(meeting => {
        const dateKey = new Date(meeting.startTime).toISOString().split('T')[0];
        if (!meetingMap[dateKey]) {
          meetingMap[dateKey] = [];
        }
        meetingMap[dateKey].push(meeting);
      });

      setMeetings(meetingMap);
    } catch (error) {
      console.error('Fetch meetings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-28"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = new Date(year, currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayMeetings = meetings[dateKey] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateKey;

    days.push(
      <div
        key={day}
        className={`h-24 md:h-28 p-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
          isToday ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : ''
        } ${dayMeetings.length > 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {day}
          </span>
          {dayMeetings.length > 0 && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {dayMeetings.length}
            </span>
          )}
        </div>
        <div className="mt-1 space-y-0.5 overflow-y-auto max-h-16">
          {dayMeetings.slice(0, 3).map((meeting, idx) => (
            <div
              key={idx}
              className="text-xs px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded truncate cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors"
              onClick={() => navigate(`/meetings/${meeting._id}`)}
              title={meeting.title}
            >
              {format(new Date(meeting.startTime), 'h:mm a')} {meeting.title}
            </div>
          ))}
          {dayMeetings.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{dayMeetings.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaChevronRight className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => navigate('/meetings/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Schedule</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Click on a meeting to view details</span>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1">
            <span className="w-2 h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded"></span>
            <span>Has meetings</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span>Today</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MeetingCalendar;