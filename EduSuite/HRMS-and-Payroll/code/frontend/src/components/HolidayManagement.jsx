// frontend/src/components/HolidayManagement.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function HolidayManagement() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'PUBLIC',
    description: '',
    is_optional: false
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/holidays/holidays/${selectedYear}`);
      const data = await response.json();
      setHolidays(data.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/holidays/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showToast('✅ Holiday added!', 'success');
        fetchHolidays();
        setShowForm(false);
        setFormData({ name: '', date: '', type: 'PUBLIC', description: '', is_optional: false });
      }
    } catch (error) {
      showToast('❌ Failed to add holiday', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/holidays/holidays/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('✅ Holiday deleted!', 'success');
        fetchHolidays();
      }
    } catch (error) {
      showToast('❌ Failed to delete holiday', 'error');
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      PUBLIC: 'bg-green-100 text-green-700',
      COMPANY: 'bg-blue-100 text-blue-700',
      FESTIVAL: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading holidays...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="font-bold text-gray-800 dark:text-white">🎉 Holiday Management</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 text-sm"
          >
            {showForm ? 'Cancel' : '+ Add Holiday'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Holiday Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="PUBLIC">Public</option>
              <option value="COMPANY">Company</option>
              <option value="FESTIVAL">Festival</option>
            </select>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_optional} onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })} className="w-4 h-4" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Optional Holiday</label>
            </div>
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="2" />
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Holiday</button>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {holidays.map(holiday => (
            <div key={holiday.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white">{holiday.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(holiday.date).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getTypeBadge(holiday.type)}`}>{holiday.type}</span>
                  {holiday.is_optional && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded ml-1">Optional</span>
                  )}
                  {holiday.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{holiday.description}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(holiday.id)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
              </div>
            </div>
          ))}
          {holidays.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 col-span-3">No holidays for {selectedYear}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HolidayManagement;