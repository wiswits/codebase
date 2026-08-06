import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [filterStatus, searchTerm]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/approvals', {
        params: {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchTerm
        }
      });
      setApprovals(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/api/v1/approvals/${id}/approve`);
      toast.success('Approved successfully');
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;
    
    try {
      await axios.post(`/api/v1/approvals/${id}/reject`, { reason });
      toast.success('Rejected successfully');
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'chip-amber',
      approved: 'chip-green',
      rejected: 'chip-rose',
      overdue: 'chip-rose'
    };
    return colors[status] || 'chip-gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      overdue: AlertCircle
    };
    return icons[status] || Clock;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Approvals</h1>
          <p className="text-gray-500 text-sm">Manage approval workflows</p>
        </div>
        <button 
          onClick={fetchApprovals}
          className="btn-outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No approvals found</h3>
          <p className="text-gray-400 text-sm mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Document</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Deadline</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => {
                  const StatusIcon = getStatusIcon(approval.status);
                  return (
                    <tr key={approval.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{approval.document_title}</div>
                        <div className="text-xs text-gray-400">{approval.document_number}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{approval.workflow_type}</td>
                      <td className="py-3 px-4">
                        <span className={`chip ${getStatusColor(approval.status)} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {approval.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(approval.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {approval.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprove(approval.id)}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(approval.id)}
                              className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {approval.status !== 'pending' && (
                          <span className="text-sm text-gray-400">Completed</span>
                        )}
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

export default Approvals;