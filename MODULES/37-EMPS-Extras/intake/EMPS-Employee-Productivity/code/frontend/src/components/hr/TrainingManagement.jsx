import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaVideo, FaCalendarAlt, FaUser, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TrainingManagement = () => {
  const [trainings, setTrainings] = useState([
    { id: 1, title: 'Leadership Development', type: 'online', date: '2024-03-15', duration: '2 hours', participants: 12, status: 'upcoming' },
    { id: 2, title: 'Python Programming', type: 'online', date: '2024-03-20', duration: '4 hours', participants: 8, status: 'upcoming' },
    { id: 3, title: 'Communication Skills', type: 'in-person', date: '2024-02-10', duration: '3 hours', participants: 15, status: 'completed' },
    { id: 4, title: 'Project Management', type: 'online', date: '2024-04-01', duration: '6 hours', participants: 10, status: 'upcoming' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'online',
    date: '',
    duration: '',
    maxParticipants: '',
    description: '',
    trainer: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTraining) {
      setTrainings(trainings.map(t => t.id === editingTraining.id ? { ...t, ...formData } : t));
      toast.success('Training updated successfully');
    } else {
      const newTraining = {
        id: trainings.length + 1,
        ...formData,
        participants: 0,
        status: 'upcoming'
      };
      setTrainings([...trainings, newTraining]);
      toast.success('Training created successfully');
    }
    setShowModal(false);
    setEditingTraining(null);
    setFormData({ title: '', type: 'online', date: '', duration: '', maxParticipants: '', description: '', trainer: '' });
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setFormData(training);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this training?')) {
      setTrainings(trainings.filter(t => t.id !== id));
      toast.success('Training deleted successfully');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaVideo className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Training Management</h2>
        </div>
        <button onClick={() => { setShowModal(true); setEditingTraining(null); setFormData({ title: '', type: 'online', date: '', duration: '', maxParticipants: '', description: '', trainer: '' }); }} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FaPlus /><span>Create Training</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainings.map((training) => (
          <div key={training.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{training.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{training.type === 'online' ? '🌐 Online' : '🏢 In-Person'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(training)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><FaEdit size={14} /></button>
                <button onClick={() => handleDelete(training.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><FaTrash size={14} /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2"><FaCalendarAlt /><span>{training.date}</span></div>
              <div className="flex items-center space-x-2"><FaClock /><span>{training.duration}</span></div>
              <div className="flex items-center space-x-2"><FaUser /><span>{training.participants} participants</span></div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${training.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : training.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                {training.status.toUpperCase()}
              </span>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Manage</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editingTraining ? 'Edit Training' : 'Create New Training'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="online">Online</option><option value="in-person">In-Person</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration *</label><input type="text" name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="2 hours" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Participants</label><input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trainer</label><input type="text" name="trainer" value={formData.trainer} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => { setShowModal(false); setEditingTraining(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><FaSave /><span>{editingTraining ? 'Update' : 'Create'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;