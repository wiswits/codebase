// frontend/src/components/Onboarding.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Onboarding({ employeeId }) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_description: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [tasksRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/onboarding/tasks/${employeeId}`),
        fetch(`${API_URL}/api/v1/onboarding/progress/${employeeId}`)
      ]);
      const tasksData = await tasksRes.json();
      const progressData = await progressRes.json();
      setTasks(tasksData.data || []);
      setProgress(progressData.data);
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/onboarding/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          tasks: [newTask]
        })
      });
      if (response.ok) {
        showToast('✅ Task added!', 'success');
        fetchData();
        setShowForm(false);
        setNewTask({ task_name: '', task_description: '', due_date: '' });
      }
    } catch (error) {
      showToast('❌ Failed to add task', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/onboarding/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        showToast(`✅ Task ${status}`, 'success');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to update task', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading onboarding...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">🚀 Employee Onboarding</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-8 border-gray-200 dark:border-gray-600 absolute"></div>
              <div
                className="w-20 h-20 rounded-full border-8 border-blue-600 absolute"
                style={{ clipPath: `inset(0 ${100 - progress.progress}% 0 0)` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">{progress.progress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ✅ Completed: {progress.completed || 0} / {progress.total || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ⏳ Pending: {progress.pending || 0} | 🔄 In Progress: {progress.in_progress || 0}
              </p>
              {progress.overdue > 0 && (
                <p className="text-sm text-red-600">⚠️ Overdue: {progress.overdue}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showForm && (
        <form onSubmit={handleAddTask} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.task_name}
              onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
              required
            />
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={newTask.task_description}
              onChange={(e) => setNewTask({ ...newTask, task_description: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg col-span-1 sm:col-span-2"
              rows="2"
            />
          </div>
          <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Add Task
          </button>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`p-4 bg-white dark:bg-gray-800 border rounded-lg ${
              task.status === 'OVERDUE'
                ? 'border-red-300 dark:border-red-700'
                : task.status === 'COMPLETED'
                ? 'border-green-300 dark:border-green-700'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 dark:text-white">{task.task_name}</h4>
                {task.task_description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.task_description}</p>
                )}
                {task.due_date && (
                  <p className="text-xs text-gray-400 mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
                {task.status !== 'COMPLETED' && (
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No onboarding tasks yet. Add a task to get started!
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;