import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthAttendance();
  }, [currentDate]);

  const fetchMonthAttendance = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const response = await attendanceApi.getHistory({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const attendanceMap = {};
      response.data.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        attendanceMap[dateKey] = record.status;
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Fetch attendance error:', error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'late': return 'bg-yellow-500';
      case 'absent': return 'bg-red-500';
      case 'half-day': return 'bg-blue-500';
      case 'on-leave': return 'bg-purple-500';
      case 'holiday': return 'bg-pink-500';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'P';
      case 'late': return 'L';
      case 'absent': return 'A';
      case 'half-day': return 'H';
      case 'on-leave': return 'LV';
      case 'holiday': return 'HD';
      default: return '';
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Empty cells for first week
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = new Date(year, currentDate.getMonth(), day).toISOString().split('T')[0];
    const status = attendance[dateKey];
    const isToday = new Date().toISOString().split('T')[0] === dateKey;

    days.push(
      <div
        key={day}
        className={`h-10 flex items-center justify-center rounded-lg relative ${
          isToday ? 'ring-2 ring-indigo-500' : ''
        } ${status ? getStatusColor(status) : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        <span className={`text-sm font-medium ${status ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {day}
        </span>
        {status && (
          <span className="absolute -bottom-1 text-[8px] text-white font-bold">
            {getStatusLabel(status)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Attendance Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaChevronRight className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Present</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Late</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Absent</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Half Day</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">On Leave</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Holiday</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;