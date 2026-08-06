import React, { useState, useEffect } from 'react';
import { 
  FilePlus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Printer,
  Share2,
  Trash2,
  RefreshCw,
  Layers,
  Upload
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, filterStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/documents', {
        params: {
          search: searchTerm,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      });
      setDocuments(response.data.data.documents || []);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (id) => {
    try {
      const response = await axios.post(`/api/v1/documents/${id}/generate`);
      toast.success('Document generated successfully');
      fetchDocuments();
      if (response.data.data.generatedData?.pdf) {
        // Download PDF
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${response.data.data.generatedData.pdf}`;
        link.download = `document-${id}.pdf`;
        link.click();
      }
    } catch (error) {
      toast.error('Failed to generate document');
    }
  };

  const handleVerify = async (id) => {
    try {
      await axios.post(`/api/v1/documents/${id}/verify`);
      toast.success('Document verified successfully');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to verify document');
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this document?')) return;
    try {
      await axios.post(`/api/v1/documents/${id}/revoke`);
      toast.success('Document revoked');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to revoke document');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Are you sure you want to archive this document?')) return;
    try {
      await axios.post(`/api/v1/documents/${id}/archive`);
      toast.success('Document archived');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to archive document');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'chip-amber',
      review: 'chip-blue',
      approved: 'chip-green',
      signed: 'chip-purple',
      published: 'chip-green',
      generated: 'chip-green',
      printed: 'chip-blue',
      downloaded: 'chip-blue',
      shared: 'chip-purple',
      verified: 'chip-green',
      revoked: 'chip-rose',
      archived: 'chip-gray'
    };
    return colors[status] || 'chip-gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Clock,
      review: Clock,
      approved: CheckCircle,
      signed: CheckCircle,
      published: CheckCircle,
      generated: CheckCircle,
      printed: Printer,
      downloaded: Download,
      shared: Share2,
      verified: CheckCircle,
      revoked: XCircle,
      archived: Archive
    };
    return icons[status] || Clock;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Documents</h1>
          <p className="text-gray-500 text-sm">Manage all your documents</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
          >
            <FilePlus className="w-4 h-4 mr-2" />
            New Document
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Generate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="generated">Generated</option>
              <option value="verified">Verified</option>
              <option value="printed">Printed</option>
              <option value="revoked">Revoked</option>
              <option value="archived">Archived</option>
            </select>
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
            </button>
            <button 
              onClick={fetchDocuments}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <FilePlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No documents found</h3>
          <p className="text-gray-400 text-sm mt-1">Create your first document to get started</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Document</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Number</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const StatusIcon = getStatusIcon(doc.status);
                  return (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{doc.title}</div>
                        <div className="text-xs text-gray-400">{doc.template_name || 'No template'}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{doc.document_number}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{doc.document_type}</td>
                      <td className="py-3 px-4">
                        <span className={`chip ${getStatusColor(doc.status)} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleGenerate(doc.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600"
                            title="Generate"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleVerify(doc.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-green-600"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRevoke(doc.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-rose-600"
                            title="Revoke"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleArchive(doc.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                            title="Archive"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
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

export default Documents;