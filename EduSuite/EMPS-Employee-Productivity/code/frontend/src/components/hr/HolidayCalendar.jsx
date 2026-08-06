import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarDay, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([
    { id: 1, name: 'New Year\'s Day', date: '2024-01-01', type: 'public', description: 'New Year celebration' },
    { id: 2, name: 'Republic Day', date: '2024-01-26', type: 'public', description: 'Republic Day celebration' },
    { id: 3, name: 'Holi', date: '2024-03-25', type: 'festival', description: 'Festival of colors' },
    { id: 4, name: 'Independence Day', date: '2024-08-15', type: 'public', description: 'Independence Day celebration' },
    { id: 5, name: 'Diwali', date: '2024-10-31', type: 'festival', description: 'Festival of lights' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'public',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHoliday) {
      setHolidays(holidays.map(h => h.id === editingHoliday.id ? { ...h, ...formData } : h));
      toast.success('Holiday updated successfully');
    } else {
      const newHoliday = { id: holidays.length + 1, ...formData };
      setHolidays([...holidays, newHoliday]);
      toast.success('Holiday added successfully');
    }
    setShowModal(false);
    setEditingHoliday(null);
    setFormData({ name: '', date: '', type: 'public', description: '' });
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData(holiday);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      setHolidays(holidays.filter(h => h.id !== id));
      toast.success('Holiday deleted successfully');
    }
  };

  const getHolidayTypeColor = (type) => {
    const colors = {
      public: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      festival: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      company: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      optional: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return colors[type] || colors.public;
  };

  const groupByMonth = () => {
    const groups = {};
    holidays.forEach(holiday => {
      const month = new Date(holiday.date).toLocaleString('default', { month: 'long' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(holiday);
    });
    return groups;
  };

  const groupedHolidays = groupByMonth();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Holiday Calendar</h2>
        </div>
        <button onClick={() => { setShowModal(true); setEditingHoliday(null); setFormData({ name: '', date: '', type: 'public', description: '' }); }} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FaPlus /><span>Add Holiday</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{month}</h3>
              <div className="space-y-2">
                {monthHolidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{new Date(holiday.date).getDate()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(holiday.date).toLocaleString('default', { weekday: 'short' })}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{holiday.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{holiday.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getHolidayTypeColor(holiday.type)}`}>{holiday.type.toUpperCase()}</span>
                      <button onClick={() => handleEdit(holiday)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><FaEdit size={14} /></button>
                      <button onClick={() => handleDelete(holiday.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><FaTrash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {holidays.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400"><FaCalendarDay className="mx-auto text-3xl mb-2" /><p>No holidays added yet</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Holiday Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="public">Public</option><option value="festival">Festival</option><option value="company">Company</option><option value="optional">Optional</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => { setShowModal(false); setEditingHoliday(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><FaSave /><span>{editingHoliday ? 'Update' : 'Add'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;