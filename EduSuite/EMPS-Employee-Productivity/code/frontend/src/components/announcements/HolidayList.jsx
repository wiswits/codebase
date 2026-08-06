import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaCalendarCheck, FaCalendarDay } from 'react-icons/fa';
import { announcementApi } from '../../api/announcementApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const HolidayList = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const response = await announcementApi.getHolidays();
      setHolidays(response.data || []);
    } catch (err) {
      setError('Failed to load holidays');
      console.error('Holidays fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (date) => {
    return format(new Date(date), 'MMMM');
  };

  const getDayNumber = (date) => {
    return format(new Date(date), 'dd');
  };

  const getDayName = (date) => {
    return format(new Date(date), 'EEEE');
  };

  const groupByMonth = () => {
    const groups = {};
    holidays.forEach(holiday => {
      const month = getMonthName(holiday.createdAt);
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(holiday);
    });
    return groups;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchHolidays}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const groupedHolidays = groupByMonth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Holiday List
        </h3>
        <FaCalendarCheck className="text-indigo-600 dark:text-indigo-400 text-xl" />
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FaCalendarDay className="mx-auto text-3xl mb-2" />
          <p>No holidays scheduled</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
            <div key={month}>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {month}
              </h4>
              <div className="space-y-2">
                {monthHolidays.map((holiday) => (
                  <div
                    key={holiday._id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {getDayNumber(holiday.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getDayName(holiday.createdAt)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {holiday.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {holiday.content}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Public Holiday
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HolidayList;