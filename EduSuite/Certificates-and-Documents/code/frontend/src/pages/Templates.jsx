import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Eye,
  Download,
  Upload,  
  Layers
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching templates...');
      
      const response = await axios.get('/v1/templates');
      console.log('Templates response:', response.data);
      
      if (response.data.success) {
        setTemplates(response.data.data || []);
      } else {
        setError('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error.response?.data?.error || 'Failed to fetch templates');
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (id) => {
    try {
      // Create a file input for uploading template design
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.zip';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('template', file);
        
        try {
          const response = await axios.post(`/v1/templates/${id}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          
          toast.success('Template uploaded successfully');
          fetchTemplates();
        } catch (error) {
          toast.error('Failed to upload template');
        }
      };
      
      input.click();
    } catch (error) {
      toast.error('Failed to upload template');
    }
  };

  const handleArchive = async (id) => {
    try {
      await axios.post(`/v1/templates/${id}/archive`);
      toast.success('Template archived');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to archive template');
    }
  };

  const handleClone = async (id) => {
    const name = prompt('Enter new template name:');
    if (name) {
      try {
        await axios.post(`/v1/templates/${id}/clone`, { name });
        toast.success('Template cloned successfully');
        fetchTemplates();
      } catch (error) {
        toast.error('Failed to clone template');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'chip-amber',
      review: 'chip-blue',
      approved: 'chip-green',
      published: 'chip-green',
      archived: 'chip-rose'
    };
    return colors[status] || 'chip-gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Templates</h1>
          <p className="text-gray-500 text-sm">Manage your document templates</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
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
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : error ? (
        <div className="card text-center py-12 border-rose-200 bg-rose-50">
          <div className="text-rose-600 text-lg font-semibold mb-2">Failed to fetch templates</div>
          <p className="text-rose-500 text-sm">{error}</p>
          <button 
            onClick={fetchTemplates}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No templates found</h3>
          <p className="text-gray-400 text-sm mt-1">Create your first template to get started</p>
          <button className="btn-primary mt-4">
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`chip ${getStatusColor(template.status)}`}>
                      {template.status}
                    </span>
                    <span className="text-xs text-gray-400">v{template.version}</span>
                  </div>
                  <h3 className="font-semibold text-primary text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.type}</p>
                </div>
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-10">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button 
                      onClick={() => handleClone(template.id)} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" /> Clone
                    </button>
                    <button 
                      onClick={() => handleUpload(template.id)} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                    {template.status !== 'archived' && (
                      <button 
                        onClick={() => handleArchive(template.id)} 
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-rose-600"
                      >
                        <Archive className="w-4 h-4" /> Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Updated {new Date(template.updated_at || template.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;