import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Loader
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const PrintJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/print-jobs', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined }
      });
      setJobs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch print jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (id) => {
    try {
      await axios.post(`/api/v1/print-jobs/${id}/start`);
      toast.success('Print job started');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to start job');
    }
  };

  const handleCompleteJob = async (id) => {
    try {
      await axios.post(`/api/v1/print-jobs/${id}/complete`);
      toast.success('Print job completed');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to complete job');
    }
  };

  const handleCancelJob = async (id) => {
    if (!confirm('Cancel this print job?')) return;
    try {
      await axios.post(`/api/v1/print-jobs/${id}/cancel`);
      toast.success('Print job cancelled');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      queued: 'chip-amber',
      processing: 'chip-blue',
      completed: 'chip-green',
      failed: 'chip-rose',
      cancelled: 'chip-gray'
    };
    return colors[status] || 'chip-gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-rose-600',
      normal: 'text-blue-600',
      low: 'text-gray-500'
    };
    return colors[priority] || 'text-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      queued: Clock,
      processing: Loader,
      completed: CheckCircle,
      failed: XCircle,
      cancelled: XCircle
    };
    return icons[status] || Clock;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Print Jobs</h1>
          <p className="text-gray-500 text-sm">Manage print queue</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Print Job
          </button>
          <button 
            onClick={fetchJobs}
            className="btn-outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search print jobs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No print jobs</h3>
          <p className="text-gray-400 text-sm mt-1">Queue is empty</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Job ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Documents</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status);
                  return (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">#{job.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{job.job_type}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {job.document_ids ? JSON.parse(job.document_ids).length : 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`chip ${getStatusColor(job.status)} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {job.status === 'queued' && (
                            <button 
                              onClick={() => handleStartJob(job.id)}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
                            >
                              Start
                            </button>
                          )}
                          {job.status === 'processing' && (
                            <button 
                              onClick={() => handleCompleteJob(job.id)}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100"
                            >
                              Complete
                            </button>
                          )}
                          {(job.status === 'queued' || job.status === 'processing') && (
                            <button 
                              onClick={() => handleCancelJob(job.id)}
                              className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintJobs;