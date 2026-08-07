import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  User,
  Calendar,
  Activity
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    generated: 0,
    verified: 0,
    today: 0
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/audit', {
        params: filters
      });
      setLogs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/v1/audit/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/v1/audit/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'text-green-600',
      UPDATE: 'text-blue-600',
      DELETE: 'text-rose-600',
      GENERATE: 'text-purple-600',
      VERIFY: 'text-emerald-600',
      LOGIN: 'text-indigo-600',
      LOGOUT: 'text-gray-600',
      APPROVE: 'text-emerald-600',
      REJECT: 'text-rose-600'
    };
    return colors[action] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Audit Log</h1>
          <p className="text-gray-500 text-sm">Track all system activities</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={fetchLogs}
            className="btn-outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Total Events</div>
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-2xl font-bold text-primary">{stats.today}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Created</div>
          <div className="text-2xl font-bold text-green-600">{stats.created}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Verified</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Action"
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({...filters, userId: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <button 
            onClick={() => setFilters({ action: '', resourceType: '', dateFrom: '', dateTo: '', userId: '' })}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No logs found</h3>
          <p className="text-gray-400 text-sm mt-1">No activities recorded</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Resource</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">IP</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">User #{log.user_id}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {log.resource_type} #{log.resource_id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{log.ip_address || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;