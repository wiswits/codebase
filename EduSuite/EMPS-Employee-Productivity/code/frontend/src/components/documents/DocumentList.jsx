import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaFileAlt } from 'react-icons/fa';
import { documentApi } from '../../api/documentApi';
import DocumentCard from './DocumentCard';
import DocumentSearch from './DocumentSearch';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    department: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (searchQuery) params.search = searchQuery;
      
      const response = await documentApi.getAll(params);
      setDocuments(response.data || []);
    } catch (err) {
      setError('Failed to load documents');
      toast.error('Failed to load documents');
      console.error('Document fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchDocuments();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentApi.delete(id);
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
        console.error('Delete error:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaFileAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Documents
          </h2>
        </div>
        <button
          onClick={() => navigate('/documents/upload')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Upload Document</span>
        </button>
      </div>

      <DocumentSearch
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        filters={filters}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FaFileAlt className="mx-auto text-4xl mb-2" />
          <p className="text-lg">No documents found</p>
          <p className="text-sm mt-1">Upload a document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <DocumentCard
              key={document._id}
              document={document}
              onDelete={handleDelete}
              onUpdate={fetchDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;