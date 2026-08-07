// frontend/src/components/Reports.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Reports() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState('employees');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState('2026-27');
  const [periodMonth, setPeriodMonth] = useState('');
  const [periodYear, setPeriodYear] = useState('');

  const reportTypes = [
    { value: 'employees', label: '👥 Employee Master' },
    { value: 'leave-ledger', label: '📋 Leave Ledger' },
    { value: 'cpd-compliance', label: '📚 CPD Compliance' },
    { value: 'appraisals', label: '📊 Appraisal Report' },
    { value: 'exits', label: '🚪 Exit Report' },
    { value: 'payroll-register', label: '💰 Payroll Register' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/v1/reports/${reportType}`;
      
      if (reportType === 'cpd-compliance' && fy) {
        url += `?fy=${fy}`;
      }
      if (reportType === 'payroll-register') {
        const params = [];
        if (periodMonth) params.push(`period_month=${periodMonth}`);
        if (periodYear) params.push(`period_year=${periodYear}`);
        if (params.length) url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setData(result.data || []);
        setMeta(result.meta || {});
        showToast('✅ Report loaded successfully!', 'success');
      } else {
        showToast('❌ Failed to load report', 'error');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      showToast('❌ Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const downloadCSV = () => {
    if (data.length === 0) {
      showToast('⚠️ No data to download', 'warning');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('✅ CSV downloaded!', 'success');
  };

  const getFilterFields = () => {
    if (reportType === 'cpd-compliance') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Financial Year</label>
          <input
            type="text"
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 w-32"
            placeholder="2026-27"
          />
        </div>
      );
    }
    if (reportType === 'payroll-register') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 w-20"
              placeholder="7"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <input
              type="number"
              value={periodYear}
              onChange={(e) => setPeriodYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 w-24"
              placeholder="2026"
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Reports</h2>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          {getFilterFields()}

          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>

          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Meta Info */}
      {meta.total !== undefined && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Total Records: {meta.total}</span>
          {meta.report_type && <span className="ml-4">| Report: {meta.report_type}</span>}
          {meta.generated_at && (
            <span className="ml-4">| Generated: {new Date(meta.generated_at).toLocaleString()}</span>
          )}
          {meta.fy && <span className="ml-4">| FY: {meta.fy}</span>}
          {meta.target_hours && <span className="ml-4">| Target: {meta.target_hours} hrs</span>}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading report...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">No data available</div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {Object.keys(data[0]).map(key => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {val !== null && val !== undefined ? String(val) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;