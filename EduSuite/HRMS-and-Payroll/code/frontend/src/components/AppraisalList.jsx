// frontend/src/components/AppraisalList.jsx
import { useState, useEffect } from 'react';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function AppraisalList({ employeeId }) {
  const [cycles, setCycles] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [kras, setKras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [cycleForm, setCycleForm] = useState({ name: '', period_from: '', period_to: '', status: 'DRAFT' });
  const [kraForm, setKraForm] = useState({ kra_title: '', weightage_pct: '', target: '' });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [cyclesRes, appraisalsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/appraisal/cycles`),
        fetch(`${API_URL}/api/v1/appraisal/appraisals/${employeeId}`)
      ]);
      const cyclesData = await cyclesRes.json();
      const appraisalsData = await appraisalsRes.json();
      setCycles(cyclesData.data || []);
      setAppraisals(appraisalsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKRAs = async (appraisalId) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/appraisal/kras/${appraisalId}`);
      const data = await res.json();
      setKras(data.data || []);
    } catch (error) {
      console.error('Error fetching KRAs:', error);
    }
  };

  const handleCycleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/appraisal/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycleForm)
      });
      if (response.ok) {
        alert('✅ Appraisal cycle created!');
        fetchData();
        setCycleForm({ name: '', period_from: '', period_to: '', status: 'DRAFT' });
        setShowForm(false);
      }
    } catch (error) {
      alert('❌ Failed to create cycle');
    }
  };

  const handleKraSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/appraisal/kras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appraisal_id: 1, ...kraForm, weightage_pct: parseFloat(kraForm.weightage_pct) })
      });
      if (response.ok) {
        alert('✅ KRA added!');
        setKraForm({ kra_title: '', weightage_pct: '', target: '' });
        fetchKRAs(1);
      }
    } catch (error) {
      alert('❌ Failed to add KRA');
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading appraisals...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">📊 Appraisal Cycles</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700">{showForm ? 'Cancel' : '+ New Cycle'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCycleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Cycle Name" value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <input type="date" value={cycleForm.period_from} onChange={(e) => setCycleForm({ ...cycleForm, period_from: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <input type="date" value={cycleForm.period_to} onChange={(e) => setCycleForm({ ...cycleForm, period_to: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <select value={cycleForm.status} onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg">
              <option value="DRAFT">Draft</option><option value="OPEN">Open</option><option value="REVIEW">Review</option><option value="CLOSED">Closed</option>
            </select>
          </div>
          <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create Cycle</button>
        </form>
      )}

      <div className="space-y-2">
        {cycles.map(cycle => (
          <div key={cycle.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm">
            <div>
              <span className="font-medium text-gray-800 dark:text-white">{cycle.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{cycle.period_from} → {cycle.period_to}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${cycle.status === 'OPEN' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : cycle.status === 'DRAFT' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : cycle.status === 'REVIEW' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>{cycle.status}</span>
          </div>
        ))}
        {cycles.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 py-4">No appraisal cycles created</div>}
      </div>

      <div className="mt-6">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">🎯 KRAs</h4>
        <form onSubmit={handleKraSubmit} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="KRA Title" value={kraForm.kra_title} onChange={(e) => setKraForm({ ...kraForm, kra_title: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <input type="number" placeholder="Weightage %" value={kraForm.weightage_pct} onChange={(e) => setKraForm({ ...kraForm, weightage_pct: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" required />
            <input type="text" placeholder="Target" value={kraForm.target} onChange={(e) => setKraForm({ ...kraForm, target: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg" />
          </div>
          <button type="submit" className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700">Add KRA</button>
        </form>
        {kras.map(kra => <div key={kra.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"><span className="font-medium text-gray-800 dark:text-white">{kra.kra_title}</span><span className="text-gray-500 dark:text-gray-400">{kra.weightage_pct}%</span></div>)}
        {kras.length === 0 && <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">No KRAs added</div>}
      </div>
    </div>
  );
}

export default AppraisalList;