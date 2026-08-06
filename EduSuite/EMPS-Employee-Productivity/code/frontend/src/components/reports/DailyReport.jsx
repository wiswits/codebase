import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportApi } from '../../api/reportApi';
import { taskApi } from '../../api/taskApi';
import { FaSave, FaFileAlt, FaChartLine, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const DailyReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    tasksCompleted: [],
    tasksPending: [],
    challenges: '',
    plans: '',
    notes: ''
  });

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  const fetchTodayTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getMyTasks({ status: 'in-progress' });
      setTasks(response.data || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskToggle = (taskId, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(taskId)
        ? prev[field].filter(id => id !== taskId)
        : [...prev[field], taskId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportApi.submitDaily(formData);
      toast.success('Daily report submitted successfully');
      setFormData({
        tasksCompleted: [],
        tasksPending: [],
        challenges: '',
        plans: '',
        notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FaFileAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Daily Report
            </h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'MMMM dd, yyyy')}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasks Completed
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned</p>
              ) : (
                tasks.map((task) => (
                  <label
                    key={task._id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.tasksCompleted.includes(task._id)}
                      onChange={() => handleTaskToggle(task._id, 'tasksCompleted')}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasks Pending
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending tasks</p>
              ) : (
                tasks.map((task) => (
                  <label
                    key={task._id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.tasksPending.includes(task._id)}
                      onChange={() => handleTaskToggle(task._id, 'tasksPending')}
                      className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Challenges Faced
            </label>
            <textarea
              name="challenges"
              value={formData.challenges}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Describe any challenges you faced today..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plans for Tomorrow
            </label>
            <textarea
              name="plans"
              value={formData.plans}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="What are your plans for tomorrow?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReport;