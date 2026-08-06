import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [formData, setFormData] = useState({
    alumni_id: user?.id || '', purpose: '', amount: '', donation_date: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [donationsRes, myRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/donations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/donations/my/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/donations/summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDonations(donationsRes.data.data || []);
      setMyDonations(myRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/donations`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert(`✅ Donation recorded! Receipt: ${response.data.data.receipt_number}`);
        fetchData();
        setShowForm(false);
        setFormData({ alumni_id: user?.id, purpose: '', amount: '', donation_date: new Date().toISOString().split('T')[0], notes: '' });
      }
    } catch (error) {
      alert('❌ Failed to record donation');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading donations...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">💰 Donations</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
              <p className="text-sm text-gray-500">Total Donations</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total_amount || 0)}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
              <p className="text-sm text-gray-500">Total Donors</p>
              <p className="text-2xl font-bold text-gray-800">{summary.total_donations || 0}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
              <p className="text-sm text-gray-500">Scholarship Fund</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.scholarship_fund || 0)}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
              <p className="text-sm text-gray-500">Infrastructure Fund</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.infrastructure_fund || 0)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-lg text-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>All Donations</button>
          <button onClick={() => setViewMode('my')} className={`px-4 py-2 rounded-lg text-sm ${viewMode === 'my' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>My Donations</button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Record Donation</button>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Purpose" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="date" value={formData.donation_date} onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Record Donation</button>
            </form>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumni</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(viewMode === 'all' ? donations : myDonations).map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{donation.receipt_number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{donation.alumni_name || 'You'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{donation.purpose}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{formatCurrency(donation.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(donation.donation_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${donation.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{donation.status}</span>
                    </td>
                  </tr>
                ))}
                {(viewMode === 'all' ? donations : myDonations).length === 0 && (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500">No donations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Donations;