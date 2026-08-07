import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaUser } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';
import { toast } from 'react-toastify';

const ManualAttendanceCorrection = ({ record, onCorrectionComplete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [corrections, setCorrections] = useState({
    checkInTime: '',
    checkOutTime: '',
    lunchStart: '',
    lunchEnd: '',
    status: '',
    notes: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setCorrections({
      checkInTime: record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : '',
      checkOutTime: record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : '',
      lunchStart: record.lunchBreak?.start ? new Date(record.lunchBreak.start).toLocaleTimeString() : '',
      lunchEnd: record.lunchBreak?.end ? new Date(record.lunchBreak.end).toLocaleTimeString() : '',
      status: record.status || '',
      notes: record.notes || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const correctionsArray = [];
      
      if (corrections.checkInTime !== record.checkIn?.time) {
        correctionsArray.push({
          field: 'checkIn.time',
          value: corrections.checkInTime
        });
      }
      
      if (corrections.checkOutTime !== record.checkOut?.time) {
        correctionsArray.push({
          field: 'checkOut.time',
          value: corrections.checkOutTime
        });
      }
      
      if (corrections.status !== record.status) {
        correctionsArray.push({
          field: 'status',
          value: corrections.status
        });
      }

      if (correctionsArray.length === 0) {
        toast.info('No changes to save');
        setIsEditing(false);
        return;
      }

      await attendanceApi.correct(record._id, {
        corrections: correctionsArray,
        reason: corrections.notes || 'Manual correction'
      });

      toast.success('Attendance corrected successfully');
      setIsEditing(false);
      if (onCorrectionComplete) onCorrectionComplete();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to correct attendance');
      console.error('Correction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCorrections(prev => ({ ...prev, [name]: value }));
  };

  if (!isEditing) {
    return (
      <button
        onClick={handleEdit}
        className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
      >
        <FaEdit />
        <span>Correct</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manual Attendance Correction
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check In Time
            </label>
            <input
              type="time"
              name="checkInTime"
              value={corrections.checkInTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check Out Time
            </label>
            <input
              type="time"
              name="checkOutTime"
              value={corrections.checkOutTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={corrections.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="on-leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correction Notes
            </label>
            <textarea
              name="notes"
              value={corrections.notes}
              onChange={handleChange}
              placeholder="Reason for correction..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows="2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Correction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceCorrection;