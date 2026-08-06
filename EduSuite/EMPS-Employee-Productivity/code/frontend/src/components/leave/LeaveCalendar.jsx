import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { leaveApi } from '../../api/leaveApi';
import { format } from 'date-fns';

const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthLeaves();
  }, [currentDate]);

  const fetchMonthLeaves = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const response = await leaveApi.getAll({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'approved'
      });

      const leaveMap = {};
      response.data.forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0];
          if (!leaveMap[dateKey]) {
            leaveMap[dateKey] = [];
          }
          leaveMap[dateKey].push({
            employee: leave.employee?.firstName + ' ' + leave.employee?.lastName,
            type: leave.type
          });
        }
      });

      setLeaves(leaveMap);
    } catch (error) {
      console.error('Fetch leaves error:', error);
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

  const getLeaveTypeColor = (type) => {
    const colors = {
      casual: 'bg-blue-200 dark:bg-blue-900/30',
      sick: 'bg-green-200 dark:bg-green-900/30',
      emergency: 'bg-red-200 dark:bg-red-900/30',
      paid: 'bg-purple-200 dark:bg-purple-900/30',
      'half-day': 'bg-yellow-200 dark:bg-yellow-900/30',
      'work-from-home': 'bg-indigo-200 dark:bg-indigo-900/30'
    };
    return colors[type] || 'bg-gray-200 dark:bg-gray-700';
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

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-20"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = new Date(year, currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayLeaves = leaves[dateKey] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateKey;

    days.push(
      <div
        key={day}
        className={`h-20 p-1 border border-gray-200 dark:border-gray-700 rounded-lg ${
          isToday ? 'ring-2 ring-indigo-500' : ''
        } ${dayLeaves.length > 0 ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
      >
        <span className={`text-sm font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {day}
        </span>
        <div className="mt-1 space-y-0.5">
          {dayLeaves.slice(0, 2).map((leave, idx) => (
            <div
              key={idx}
              className={`text-xs px-1 py-0.5 rounded truncate ${getLeaveTypeColor(leave.type)}`}
              title={`${leave.employee} - ${leave.type}`}
            >
              {leave.employee}
            </div>
          ))}
          {dayLeaves.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{dayLeaves.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Leave Calendar
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Legend:</span>
        {Object.entries({
          casual: 'Casual',
          sick: 'Sick',
          emergency: 'Emergency',
          paid: 'Paid',
          'half-day': 'Half Day',
          'work-from-home': 'WFH'
        }).map(([type, label]) => (
          <div key={type} className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded ${getLeaveTypeColor(type)}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveCalendar;