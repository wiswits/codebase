import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaClock, FaUsers, FaFlag, FaPaperclip } from 'react-icons/fa';
import { taskApi } from '../../api/taskApi';
import TaskComments from './TaskComments';
import TaskProgress from './TaskProgress';
import UploadWork from './UploadWork';
import LoadingSpinner from '../common/LoadingSpinner';
import { StatusBadge } from '../dashboard/DashboardWidgets';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getById(id);
      setTask(response.data);
    } catch (err) {
      setError('Failed to load task');
      toast.error('Failed to load task');
      console.error('Task fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(id);
        toast.success('Task deleted successfully');
        navigate('/tasks');
      } catch (error) {
        toast.error('Failed to delete task');
        console.error('Delete error:', error);
      }
    }
  };

  const handleUpdate = () => {
    fetchTask();
  };

  if (loading) return <LoadingSpinner />;

  if (error || !task) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error || 'Task not found'}</p>
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 dark:text-gray-400',
      medium: 'text-blue-600 dark:text-blue-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Tasks</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/tasks/${id}/edit`)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FaEdit />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaTrash />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {task.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {task.description}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <FaUsers className="text-gray-400" />
            <span className="text-sm">
              Assigned to: {task.assignedTo?.map(u => `${u.firstName} ${u.lastName}`).join(', ')}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <FaClock className="text-gray-400" />
            <span className="text-sm">
              Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FaFlag className="text-gray-400" />
            <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
              Priority: {task.priority.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <TaskProgress
            progress={task.progress || 0}
            status={task.status}
            onUpdate={handleUpdate}
            taskId={task._id}
          />
        </div>

        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaPaperclip className="inline mr-1" /> Attachments
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((att, index) => (
                <a
                  key={index}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {att.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Comments ({task.comments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Upload Work
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned By</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {task.assignedBy?.firstName} {task.assignedBy?.lastName}
                </p>
              </div>
              {task.subtasks && task.subtasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</h4>
                  <div className="space-y-1">
                    {task.subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          readOnly
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <TaskComments taskId={task._id} comments={task.comments} onUpdate={handleUpdate} />
          )}

          {activeTab === 'upload' && (
            <UploadWork taskId={task._id} onUpload={handleUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;