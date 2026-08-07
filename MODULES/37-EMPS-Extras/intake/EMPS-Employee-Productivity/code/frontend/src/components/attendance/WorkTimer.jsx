import React, { useState, useEffect } from 'react';
import { FaClock, FaHourglassHalf, FaCoffee, FaChartLine } from 'react-icons/fa';

const WorkTimer = ({ checkIn, checkOut, lunchBreak }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (checkIn && !checkOut) {
      setIsRunning(true);
      const startTime = new Date(checkIn).getTime();
      const lunchDuration = lunchBreak ? 
        (new Date(lunchBreak.end) - new Date(lunchBreak.start)) / (1000 * 60) : 0;

      interval = setInterval(() => {
        const now = Date.now();
        const totalMinutes = (now - startTime) / (1000 * 60);
        const adjustedMinutes = Math.max(0, totalMinutes - lunchDuration);
        setElapsedTime(adjustedMinutes);
      }, 1000);
    } else if (checkOut) {
      setIsRunning(false);
      const startTime = new Date(checkIn).getTime();
      const endTime = new Date(checkOut).getTime();
      const lunchDuration = lunchBreak ? 
        (new Date(lunchBreak.end) - new Date(lunchBreak.start)) / (1000 * 60) : 0;
      const totalMinutes = (endTime - startTime) / (1000 * 60);
      setElapsedTime(Math.max(0, totalMinutes - lunchDuration));
    }

    return () => clearInterval(interval);
  }, [checkIn, checkOut, lunchBreak]);

  const formatTime = (minutes) => {
    if (minutes < 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getProgress = () => {
    const targetHours = 8;
    const progress = (elapsedTime / (targetHours * 60)) * 100;
    return Math.min(progress, 100);
  };

  const getStatus = () => {
    if (!checkIn) return 'Not Started';
    if (checkOut) return 'Completed';
    if (isRunning) return 'In Progress';
    return 'Paused';
  };

  const getStatusColor = () => {
    const status = getStatus();
    if (status === 'Not Started') return 'text-gray-500';
    if (status === 'Completed') return 'text-green-600';
    if (status === 'In Progress') return 'text-indigo-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Work Timer
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaClock className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatus()}
          </span>
        </div>

        <div className="text-center py-4">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatTime(elapsedTime)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total Working Time
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Progress</span>
            <span className="text-gray-900 dark:text-white">{Math.round(getProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">8h 0m</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatTime(Math.max(0, 480 - elapsedTime))}
            </p>
          </div>
        </div>

        {lunchBreak && lunchBreak.start && lunchBreak.end && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaCoffee className="text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Lunch Break</span>
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {formatTime((new Date(lunchBreak.end) - new Date(lunchBreak.start)) / (1000 * 60))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTimer;