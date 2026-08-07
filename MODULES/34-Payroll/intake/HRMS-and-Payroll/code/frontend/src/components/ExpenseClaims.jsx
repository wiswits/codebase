// frontend/src/components/ExpenseClaims.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function ExpenseClaims({ employeeId }) {
  const { showToast } = useToast();
  const [claims, setClaims] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', amount: '', expense_date: '', receipt_path: ''
  });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [claimsRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/expenses/claims/${employeeId}`),
        fetch(`${API_URL}/api/v1/expenses/claims/pending/all`)
      ]);
      const claimsData = await claimsRes.json();
      const pendingData = await pendingRes.json();
      setClaims(claimsData.data || []);
      setPendingClaims(pendingData.data || []);
    } catch (error) {
      console.error('Error fetching expense data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/expenses/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, ...formData, amount: parseFloat(formData.amount) })
      });
      if (response.ok) {
        showToast('✅ Expense claim submitted!', 'success');
        fetchData();
        setShowForm(false);
        setFormData({ title: '', description: '', amount: '', expense_date: '', receipt_path: '' });
      }
    } catch (error) {
      showToast('❌ Failed to submit expense claim', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/expenses/claims/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 1 })
      });
      if (response.ok) {
        showToast('✅ Expense claim approved!', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to approve', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/expenses/claims/${id}/reject`, {
        method: 'PUT'
      });
      if (response.ok) {
        showToast('✅ Expense claim rejected', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to reject', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      PAID: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading expenses...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">💰 Expense Claims</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Claim'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="px-3 py-2 border rounded-lg" required />
            <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="px-3 py-2 border rounded-lg" required />
            <input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="Receipt Path" value={formData.receipt_path} onChange={(e) => setFormData({ ...formData, receipt_path: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="px-3 py-2 border rounded-lg col-span-2" rows="2" />
          </div>
          <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Submit Claim</button>
        </form>
      )}

      <h4 className="font-medium text-gray-700 mb-2">📋 My Claims</h4>
      {claims.map(claim => (
        <div key={claim.id} className="flex justify-between items-center p-3 bg-white border rounded-lg mb-2">
          <div>
            <span className="font-medium">{claim.title}</span>
            <span className="text-sm text-gray-500 ml-2">₹{claim.amount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(claim.status)}`}>{claim.status}</span>
            <span className="text-xs text-gray-400">{new Date(claim.expense_date).toLocaleDateString()}</span>
          </div>
        </div>
      ))}

      {pendingClaims.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">⏳ Pending Approvals</h4>
          {pendingClaims.map(claim => (
            <div key={claim.id} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
              <div>
                <span className="font-medium">{claim.employee_name}</span>
                <span className="text-sm ml-2">{claim.title}</span>
                <span className="text-sm text-gray-500 ml-2">₹{claim.amount}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(claim.id)} className="text-green-600 hover:text-green-800 text-sm">Approve</button>
                <button onClick={() => handleReject(claim.id)} className="text-red-600 hover:text-red-800 text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseClaims;