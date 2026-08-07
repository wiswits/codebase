import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { taskApi } from '../../api/taskApi';
import { toast } from 'react-toastify';

const TaskProgress = ({ progress, status, onUpdate, taskId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(progress || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (value < 0 || value > 100) {
      toast.error('Progress must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await taskApi.update(taskId, { progress: value });
      toast.success('Progress updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update progress');
      console.error('Update progress error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (status === 'completed') return 'Completed';
    if (progress >= 100) return 'Complete';
    if (progress >= 75) return 'Mostly Complete';
    if (progress >= 50) return 'Halfway There';
    if (progress >= 25) return 'In Progress';
    return 'Just Started';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {Math.round(value)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({getStatusText()})
          </span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <FaEdit size={14} />
        </button>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 animate-pulse"></div>
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center space-x-2 mt-2">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>{value}%</span>
              <span>100%</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaSave />
            )}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setValue(progress || 0);
            }}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskProgress;