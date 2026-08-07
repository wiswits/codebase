// frontend/src/components/SalaryStructure.jsx
import { useState, useEffect } from 'react';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function SalaryStructure({ employeeId, onClose }) {
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: employeeId,
    effective_from: new Date().toISOString().split('T')[0],
    basic: 25000,
    hra: 12500,
    conveyance: 1600,
    special_allowance: 5000,
    pf_ee: 3000,
    pf_er: 3000,
    esi_ee: 750,
    esi_er: 3250,
    pt: 200,
    tds: 2000
  });

  useEffect(() => {
    fetchSalary();
  }, [employeeId]);

  const fetchSalary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll/salary-breakdown/${employeeId}`);
      const data = await response.json();
      setSalaryData(data.data || []);
    } catch (error) {
      console.error('Error fetching salary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/payroll/assign-salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('✅ Salary structure assigned!');
        fetchSalary();
        onClose();
      } else {
        const data = await response.json();
        alert('❌ ' + (data.error?.message || 'Failed to assign salary'));
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const totalEarnings = salaryData.filter(s => s.type === 'EARNING').reduce((sum, s) => sum + Number(s.amount_monthly || 0), 0);
  const totalDeductions = salaryData.filter(s => s.type === 'DEDUCTION').reduce((sum, s) => sum + Number(s.amount_monthly || 0), 0);
  const netPay = totalEarnings - totalDeductions;

  if (loading) return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading salary data...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">💰 Salary Structure</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">×</button>
      </div>

      {salaryData.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">📊 Current Salary</h4>
          {salaryData.map(s => (
            <div key={s.code} className="flex justify-between p-2 bg-white dark:bg-gray-700 rounded mb-1">
              <span className="text-gray-700 dark:text-gray-300">{s.name} ({s.code})</span>
              <span className={s.type === 'EARNING' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>₹{Number(s.amount_monthly || 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700 flex justify-between font-bold">
            <span className="text-gray-700 dark:text-gray-300">Net Pay</span>
            <span className="text-blue-600 dark:text-blue-400">₹{netPay.toFixed(2)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">✏️ Assign New Salary</h4>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Effective From</label>
          <input type="date" name="effective_from" value={formData.effective_from} onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic</label><input type="number" name="basic" value={formData.basic} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HRA</label><input type="number" name="hra" value={formData.hra} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conveyance</label><input type="number" name="conveyance" value={formData.conveyance} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Allowance</label><input type="number" name="special_allowance" value={formData.special_allowance} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PF (Employee)</label><input type="number" name="pf_ee" value={formData.pf_ee} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ESI (Employee)</label><input type="number" name="esi_ee" value={formData.esi_ee} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PT</label><input type="number" name="pt" value={formData.pt} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TDS</label><input type="number" name="tds" value={formData.tds} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
        </div>
        <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Assign Salary</button>
      </form>
    </div>
  );
}

export default SalaryStructure;