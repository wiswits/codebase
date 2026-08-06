import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaDownload, FaEye, FaFileAlt } from 'react-icons/fa';
import { documentApi } from '../../api/documentApi';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const PolicyDocuments = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await documentApi.getPolicies();
      setPolicies(response.data || []);
    } catch (err) {
      setError('Failed to load policy documents');
      console.error('Policies fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPolicyIcon = (type) => {
    const icons = {
      'company-policy': '🏢',
      'hr-policy': '👔',
      'leave-policy': '📅',
      'code-of-conduct': '📋',
      'nda': '🤫',
      'other': '📄'
    };
    return icons[type] || '📄';
  };

  const getPolicyLabel = (type) => {
    const labels = {
      'company-policy': 'Company Policy',
      'hr-policy': 'HR Policy',
      'leave-policy': 'Leave Policy',
      'code-of-conduct': 'Code of Conduct',
      'nda': 'NDA',
      'other': 'Other Policy'
    };
    return labels[type] || type;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchPolicies}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaShieldAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Company Policies
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {policies.length} documents
        </span>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FaFileAlt className="mx-auto text-3xl mb-2" />
          <p>No policy documents available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy._id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setExpanded(expanded === policy._id ? null : policy._id)}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-2xl">{getPolicyIcon(policy.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {policy.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getPolicyLabel(policy.type)} • Version {policy.version || 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(policy.createdAt), { addSuffix: true })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (policy.file?.url) {
                        window.open(policy.file.url, '_blank');
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(expanded === policy._id ? null : policy._id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <FaEye size={14} />
                  </button>
                </div>
              </div>

              {expanded === policy._id && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {policy.description || 'No description available'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Uploaded by: {policy.uploadedBy?.firstName} {policy.uploadedBy?.lastName}</span>
                    <span>•</span>
                    <span>Size: {(policy.file?.size / 1024).toFixed(1)} KB</span>
                    {policy.tags && policy.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Tags: {policy.tags.join(', ')}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      policy.isPublic 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {policy.isPublic ? 'Public' : 'Restricted'}
                    </span>
                    {policy.department && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                        {policy.department.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyDocuments;