// frontend/src/components/ExitManagement.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function ExitManagement({ employeeId }) {
  const { showToast } = useToast();
  const [exits, setExits] = useState([]);
  const [fnf, setFnf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [exitForm, setExitForm] = useState({ resignation_date: '', notice_days_required: 30, exit_type: 'RESIGNATION', reason: '' });
  const [fnfForm, setFnfForm] = useState({ final_salary: 0, gratuity_amount: 0, leave_encashment: 0, bonus_amount: 0, notice_recovery: 0, loan_recovery: 0, asset_recovery: 0 });

  useEffect(() => { fetchData(); }, [employeeId]);

  const fetchData = async () => {
    try {
      const exitsRes = await fetch(`${API_URL}/api/v1/exit/exits/${employeeId}`);
      const exitsData = await exitsRes.json();
      setExits(exitsData.data || []);
      if (exitsData.data && exitsData.data.length > 0) {
        const fnfRes = await fetch(`${API_URL}/api/v1/exit/fnf/${exitsData.data[0].id}`);
        const fnfData = await fnfRes.json();
        setFnf(fnfData.data);
      }
    } catch (error) {
      console.error('Error fetching exit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/exit/exits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, ...exitForm })
      });
      if (response.ok) {
        showToast('✅ Exit initiated!', 'success');
        fetchData();
        setShowForm(false);
      }
    } catch (error) {
      showToast('❌ Failed to initiate exit', 'error');
    }
  };

  const handleFnfSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/exit/fnf/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exit_id: exits[0]?.id, ...fnfForm })
      });
      if (response.ok) {
        showToast('✅ F&F calculated!', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to calculate F&F', 'error');
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">🚪 Exit Management</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700">{showForm ? 'Cancel' : '+ Initiate Exit'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleExitSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={exitForm.resignation_date} onChange={(e) => setExitForm({ ...exitForm, resignation_date: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <input type="number" placeholder="Notice Days Required" value={exitForm.notice_days_required} onChange={(e) => setExitForm({ ...exitForm, notice_days_required: parseInt(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <select value={exitForm.exit_type} onChange={(e) => setExitForm({ ...exitForm, exit_type: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg">
              <option value="RESIGNATION">Resignation</option><option value="TERMINATION">Termination</option>
              <option value="RETIREMENT">Retirement</option><option value="DEATH">Death</option><option value="ABSCONDING">Absconding</option>
            </select>
            <input type="text" placeholder="Reason" value={exitForm.reason} onChange={(e) => setExitForm({ ...exitForm, reason: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
          </div>
          <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Initiate Exit</button>
        </form>
      )}
      {exits.map(exit => <div key={exit.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2"><div className="flex justify-between items-center"><div><span className="font-medium text-gray-800 dark:text-white">Exit Date: {exit.resignation_date}</span><span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{exit.exit_type}</span></div><span className={`text-xs px-2 py-1 rounded ${exit.status === 'INITIATED' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : exit.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>{exit.status}</span></div></div>)}
      {exits.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-4">No exit initiated</div>}
      {exits.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">💰 Full & Final Settlement</h4>
          <form onSubmit={handleFnfSubmit} className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="Final Salary" value={fnfForm.final_salary} onChange={(e) => setFnfForm({ ...fnfForm, final_salary: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
            <input type="number" placeholder="Gratuity" value={fnfForm.gratuity_amount} onChange={(e) => setFnfForm({ ...fnfForm, gratuity_amount: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
            <input type="number" placeholder="Leave Encashment" value={fnfForm.leave_encashment} onChange={(e) => setFnfForm({ ...fnfForm, leave_encashment: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
            <input type="number" placeholder="Bonus" value={fnfForm.bonus_amount} onChange={(e) => setFnfForm({ ...fnfForm, bonus_amount: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
            <input type="number" placeholder="Notice Recovery" value={fnfForm.notice_recovery} onChange={(e) => setFnfForm({ ...fnfForm, notice_recovery: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Calculate F&F</button>
          </form>
          {fnf && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h5 className="font-bold text-gray-700 dark:text-gray-300">📊 F&F Summary</h5>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">Final Salary: ₹{fnf.final_salary}</p><p className="text-gray-600 dark:text-gray-400">Gratuity: ₹{fnf.gratuity_amount}</p>
                <p className="text-gray-600 dark:text-gray-400">Leave Encashment: ₹{fnf.leave_encashment}</p><p className="text-gray-600 dark:text-gray-400">Bonus: ₹{fnf.bonus_amount}</p>
                <p className="text-gray-600 dark:text-gray-400">Notice Recovery: -₹{fnf.notice_recovery}</p>
                <p className="font-bold text-green-600 dark:text-green-400">Net: ₹{fnf.net_settlement}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExitManagement;