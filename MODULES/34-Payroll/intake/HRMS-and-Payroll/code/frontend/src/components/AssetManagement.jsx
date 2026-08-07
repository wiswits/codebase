// frontend/src/components/AssetManagement.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function AssetManagement() {
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    asset_code: '',
    name: '',
    category: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    assigned_to: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/assets/assets`);
      const data = await response.json();
      setAssets(data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/employees`);
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/assets/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showToast('✅ Asset created!', 'success');
        fetchData();
        setShowForm(false);
        setFormData({ asset_code: '', name: '', category: '', serial_number: '', purchase_date: '', purchase_price: '', assigned_to: '', status: 'AVAILABLE' });
      }
    } catch (error) {
      showToast('❌ Failed to create asset', 'error');
    }
  };

  const handleAssign = async (id, assigned_to) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/assets/assets/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to })
      });
      if (response.ok) {
        showToast('✅ Asset assigned!', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to assign asset', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-700',
      ASSIGNED: 'bg-blue-100 text-blue-700',
      MAINTENANCE: 'bg-yellow-100 text-yellow-700',
      RETIRED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading assets...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">💻 Asset Management</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? 'Cancel' : '+ New Asset'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="Asset Code" value={formData.asset_code} onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Asset Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Serial Number" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <input type="number" placeholder="Purchase Price" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Asset</button>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assigned To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{asset.asset_code}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{asset.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{asset.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(asset.status)}`}>{asset.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{asset.assigned_to_name || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {asset.status === 'AVAILABLE' && (
                    <select
                      onChange={(e) => handleAssign(asset.id, parseInt(e.target.value))}
                      className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Assign to</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  )}
                  {asset.status === 'ASSIGNED' && (
                    <span className="text-xs text-blue-600">Assigned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No assets found</div>
        )}
      </div>
    </div>
  );
}

export default AssetManagement;