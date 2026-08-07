import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('alumni');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'alumni', label: '👥 Alumni Report' },
    { value: 'mentorship', label: '🤝 Mentorship Report' },
    { value: 'donations', label: '💰 Donation Report' },
    { value: 'events', label: '📅 Event Report' },
    { value: 'reunions', label: '🎉 Reunion Report' },
    { value: 'stories', label: '📖 Story Report' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/reports/${reportType}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('❌ Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) { alert('No data to download'); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📊 Reports</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Report</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                {reportTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">🔄 Generate Report</button>
            <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">📥 Download CSV</button>
          </div>
        </div>

        {meta.total !== undefined && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Records:</span> {meta.total}
              {meta.report_type && <span className="ml-4"><span className="font-medium">Report:</span> {meta.report_type}</span>}
            </p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading report...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No data available. Generate a report to see results.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>{Object.keys(data[0]).map((key) => <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, idx) => <tr key={idx} className="hover:bg-gray-50">{Object.values(row).map((val, i) => <td key={i} className="px-4 py-3 text-sm text-gray-600">{val !== null && val !== undefined ? String(val) : '-'}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;