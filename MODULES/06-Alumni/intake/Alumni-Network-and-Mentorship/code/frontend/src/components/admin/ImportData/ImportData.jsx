import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function ImportData() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [csvData, setCsvData] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/import/logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
      result.push(obj);
    }
    return result;
  };

  const handleImport = async () => {
    if (!csvData.trim()) { alert('Please paste CSV data'); return; }
    setImporting(true);
    try {
      const parsedData = parseCSV(csvData);
      const response = await axios.post(`${API_URL}/import`, {
        alumni_data: parsedData, imported_by: user?.id
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setResult(response.data.data);
      alert(`✅ ${response.data.meta.message}`);
      fetchLogs();
      setCsvData('');
    } catch (error) {
      alert('❌ Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  const viewLog = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/import/logs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedLog(response.data.data);
    } catch (error) {
      alert('❌ Failed to fetch log details');
    }
  };

  const sampleCSV = `full_name,email,batch_year,course,current_company,designation,industry,city
Rahul Sharma,rahul@example.com,2020,B.Tech CSE,Google,Software Engineer,IT,Bangalore
Priya Patel,priya@example.com,2019,B.Tech ECE,Microsoft,Product Manager,IT,Hyderabad`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📥 Bulk Import</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
            <h3 className="font-bold text-gray-800 mb-4">📤 Import Alumni Data</h3>
            <p className="text-sm text-gray-500 mb-4">Paste CSV data with headers: full_name, email, batch_year, course, current_company, designation, industry, city</p>
            <textarea value={csvData} onChange={(e) => setCsvData(e.target.value)} placeholder={sampleCSV} className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setCsvData(sampleCSV)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">Load Sample</button>
              <button onClick={handleImport} disabled={importing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{importing ? 'Importing...' : 'Import Data'}</button>
            </div>
            {result && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">✅ Success: {result.success}</p>
                <p className="text-red-700">❌ Failed: {result.failed}</p>
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
            <h3 className="font-bold text-gray-800 mb-4">📋 Import Logs</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No import logs found</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewLog(log.id)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{log.file_name}</p>
                        <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()} • {log.imported_by_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">✅ {log.success_records}</p>
                        <p className="text-sm text-red-600">❌ {log.failed_records}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">📋 Import Details</h3>
                <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium">File:</span> {selectedLog.file_name}</p>
                <p><span className="font-medium">Total:</span> {selectedLog.total_records}</p>
                <p><span className="font-medium text-green-600">Success:</span> {selectedLog.success_records}</p>
                <p><span className="font-medium text-red-600">Failed:</span> {selectedLog.failed_records}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-700 mb-2">Logs:</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">{selectedLog.logs || 'No logs available'}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportData;