import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaClock, FaComment } from 'react-icons/fa';
import { leaveApi } from '../../api/leaveApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { StatusBadge } from '../dashboard/DashboardWidgets';

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      const response = await leaveApi.getAll({ status: 'pending' });
      setLeaves(response.data || []);
    } catch (err) {
      setError('Failed to load pending leaves');
      console.error('Pending leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (leaveId, status) => {
    try {
      await leaveApi.approve(leaveId, { status, comments: comment });
      toast.success(`Leave ${status} successfully`);
      setSelectedLeave(null);
      setComment('');
      fetchPendingLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process leave');
      console.error('Approval error:', error);
    }
  };

  const leaveTypeLabels = {
    casual: 'Casual',
    sick: 'Sick',
    emergency: 'Emergency',
    paid: 'Paid',
    'half-day': 'Half Day',
    'work-from-home': 'WFH'
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchPendingLeaves}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Pending Leave Requests
      </h3>

      {leaves.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FaClock className="mx-auto text-4xl mb-2" />
          <p>No pending leave requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedLeave?._id === leave._id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {leave.employee?.employeeId}
                    </span>
                    <StatusBadge status={leave.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {leaveTypeLabels[leave.type] || leave.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">From:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {format(new Date(leave.startDate), 'MMM dd')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">To:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {format(new Date(leave.endDate), 'MMM dd')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Days:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {leave.totalDays}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {leave.reason}
                  </p>
                  {leave.attachments && leave.attachments.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Attachments: {leave.attachments.length}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedLeave?._id === leave._id ? (
                    <button
                      onClick={() => setSelectedLeave(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedLeave(leave)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              {selectedLeave?._id === leave._id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaComment className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Add a comment (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApproval(leave._id, 'approved')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproval(leave._id, 'rejected')}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaTimes />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;