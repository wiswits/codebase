import React, { useState } from 'react';
import { FaFile, FaTrash, FaEdit, FaDownload, FaEye, FaUser, FaCalendarAlt, FaTag } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { documentApi } from '../../api/documentApi';
import { toast } from 'react-toastify';

const DocumentCard = ({ document, onDelete, onUpdate }) => {
  const [deleting, setDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getFileIcon = (type) => {
    const icons = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'image/jpeg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️'
    };
    return icons[document.file?.mimeType] || '📁';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'company-policy': 'Company Policy',
      'hr-policy': 'HR Policy',
      'leave-policy': 'Leave Policy',
      'code-of-conduct': 'Code of Conduct',
      'nda': 'NDA',
      'offer-letter': 'Offer Letter',
      'salary-slip': 'Salary Slip',
      'appointment-letter': 'Appointment Letter',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const handleDownload = () => {
    if (document.file?.url) {
      window.open(document.file.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDeleting(true);
      try {
        await documentApi.delete(document._id);
        toast.success('Document deleted successfully');
        if (onDelete) onDelete(document._id);
        if (onUpdate) onUpdate();
      } catch (error) {
        toast.error('Failed to delete document');
        console.error('Delete error:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="text-3xl flex-shrink-0">
              {getFileIcon(document.file?.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {document.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {getTypeLabel(document.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="View Details"
            >
              <FaEye size={14} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Download"
            >
              <FaDownload size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FaTrash size={14} />
              )}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {document.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {document.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <FaUser size={10} />
                <span>{document.uploadedBy?.firstName} {document.uploadedBy?.lastName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FaCalendarAlt size={10} />
                <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
              </span>
              {document.department && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {document.department.name}
                </span>
              )}
              {document.file?.size && (
                <span>
                  {(document.file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-1 text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full"
                  >
                    <FaTag size={8} />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;