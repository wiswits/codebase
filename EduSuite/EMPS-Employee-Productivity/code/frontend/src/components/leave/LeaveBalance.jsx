import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaClock, FaChartPie } from 'react-icons/fa';
import { leaveApi } from '../../api/leaveApi';
import LoadingSpinner from '../common/LoadingSpinner';

const LeaveBalance = () => {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await leaveApi.getBalance();
      setBalances(response.data);
    } catch (err) {
      setError('Failed to load leave balance');
      console.error('Leave balance error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchBalance}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const leaveTypeLabels = {
    casual: 'Casual Leave',
    sick: 'Sick Leave',
    emergency: 'Emergency Leave',
    paid: 'Paid Leave',
    'half-day': 'Half Day',
    'work-from-home': 'Work From Home'
  };

  const getProgressColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 70) return 'bg-green-500';
    if (percentage > 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Leave Balance
        </h3>
        <FaChartPie className="text-indigo-600 dark:text-indigo-400 text-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(balances || {}).map(([key, balance]) => (
          <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {leaveTypeLabels[key] || key}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {balance.remaining} / {balance.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(balance.remaining, balance.total)}`}
                style={{ width: `${(balance.remaining / balance.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Used: {balance.used}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Remaining: {balance.remaining}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <FaClock className="inline mr-1 text-indigo-500" />
          Leave balances reset annually. Plan your leave accordingly.
        </p>
      </div>
    </div>
  );
};

export default LeaveBalance;