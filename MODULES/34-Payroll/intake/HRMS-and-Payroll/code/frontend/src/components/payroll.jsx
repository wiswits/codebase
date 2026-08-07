// frontend/src/components/Payroll.jsx
import { useState, useEffect } from 'react';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function Payroll() {
  const [runs, setRuns] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    run_type: 'REGULAR'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [runsRes, compRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/payroll/runs`),
        fetch(`${API_URL}/api/v1/payroll/components`)
      ]);
      const runsData = await runsRes.json();
      const compData = await compRes.json();
      setRuns(runsData.data || []);
      setComponents(compData.data || []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('✅ Payroll run created!');
        fetchData();
        setShowForm(false);
      } else {
        const data = await response.json();
        alert('❌ ' + (data.error?.message || 'Failed to create run'));
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const handleLockRun = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll/runs/${id}/lock`, {
        method: 'PUT'
      });
      if (response.ok) {
        alert('✅ Run locked!');
        fetchData();
      }
    } catch (error) {
      alert('❌ Failed to lock run');
    }
  };

  const handleApproveRun = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll/runs/${id}/approve`, {
        method: 'PUT'
      });
      if (response.ok) {
        alert('✅ Run approved!');
        fetchData();
      }
    } catch (error) {
      alert('❌ Failed to approve run');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      LOCKED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      REVERSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      DISCARDED: 'bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading payroll...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">💰 Payroll Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Create Run'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Create Payroll Run</h3>
          <form onSubmit={handleCreateRun} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
              <input type="number" min="1" max="12" value={formData.period_month} onChange={(e) => setFormData({ ...formData, period_month: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input type="number" value={formData.period_year} onChange={(e) => setFormData({ ...formData, period_year: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Run Type</label>
              <select value={formData.run_type} onChange={(e) => setFormData({ ...formData, run_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                <option value="REGULAR">Regular</option>
                <option value="OFF_CYCLE">Off Cycle</option>
                <option value="FNF">F&F</option>
                <option value="BONUS">Bonus</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create Run</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No payroll runs yet. Create one to get started!</td>
                </tr>
              ) : (
                runs.map(run => (
                  <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{run.period_month}/{run.period_year}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{run.run_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(run.status)}`}>{run.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{run.employee_count}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">₹{run.total_net?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {run.status === 'DRAFT' && (
                        <button onClick={() => handleLockRun(run.id)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800">Lock</button>
                      )}
                      {run.status === 'LOCKED' && (
                        <button onClick={() => handleApproveRun(run.id)} className="text-green-600 dark:text-green-400 hover:text-green-800">Approve</button>
                      )}
                      {run.status === 'APPROVED' && (
                        <span className="text-blue-600 dark:text-blue-400">Ready for payment</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">📋 Salary Components</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {components.map(comp => (
            <div key={comp.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
              <span className="font-medium text-gray-800 dark:text-white">{comp.code}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">{comp.name}</span>
              <span className={`ml-2 text-xs ${comp.type === 'EARNING' ? 'text-green-600 dark:text-green-400' : comp.type === 'DEDUCTION' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {comp.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Payroll;