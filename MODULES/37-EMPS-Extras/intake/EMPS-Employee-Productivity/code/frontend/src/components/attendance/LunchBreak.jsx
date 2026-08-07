import React, { useState, useEffect } from 'react';
import { FaUtensils, FaStop } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';
import { toast } from 'react-toastify';

const LunchBreak = ({ onLunchStart, onLunchEnd }) => {
  const [loading, setLoading] = useState(false);
  const [breakStatus, setBreakStatus] = useState('not-started'); // not-started, started, ended
  const [breakDuration, setBreakDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let interval;
    if (breakStatus === 'started') {
      interval = setInterval(() => {
        setBreakDuration(Math.floor((Date.now() - startTime) / 1000 / 60));
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [breakStatus, startTime]);

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      await attendanceApi.lunchStart();
      setBreakStatus('started');
      setStartTime(Date.now());
      toast.success('Lunch break started');
      if (onLunchStart) onLunchStart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start lunch break');
      console.error('Lunch start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      await attendanceApi.lunchEnd();
      setBreakStatus('ended');
      toast.success(`Lunch break ended (${breakDuration} minutes)`);
      if (onLunchEnd) onLunchEnd();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end lunch break');
      console.error('Lunch end error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Lunch Break
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaUtensils className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Status:
            </span>
          </div>
          <span className={`text-sm font-medium ${
            breakStatus === 'started' ? 'text-green-600 dark:text-green-400' :
            breakStatus === 'ended' ? 'text-gray-500 dark:text-gray-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            {breakStatus === 'started' ? 'On Break' :
             breakStatus === 'ended' ? 'Break Ended' :
             'Not Started'}
          </span>
        </div>

        {breakStatus === 'started' && (
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Break Duration: <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {formatDuration(breakDuration)}
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Started at: {new Date(startTime).toLocaleTimeString()}
            </p>
          </div>
        )}

        {breakStatus === 'ended' && (
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Break completed: <span className="font-semibold text-green-600 dark:text-green-400">
                {formatDuration(breakDuration)}
              </span>
            </p>
          </div>
        )}

        {breakStatus === 'not-started' && (
          <button
            onClick={handleStartBreak}
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Starting...</span>
              </>
            ) : (
              <>
                <FaUtensils />
                <span>Start Lunch Break</span>
              </>
            )}
          </button>
        )}

        {breakStatus === 'started' && (
          <button
            onClick={handleEndBreak}
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Ending...</span>
              </>
            ) : (
              <>
                <FaStop />
                <span>End Lunch Break</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LunchBreak;