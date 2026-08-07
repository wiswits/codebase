import React, { useState } from 'react';
import { FaBell, FaThumbtack, FaTrash, FaEdit, FaEye, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { announcementApi } from '../../api/announcementApi';
import { toast } from 'react-toastify';
import { StatusBadge } from '../dashboard/DashboardWidgets';

const AnnouncementCard = ({ announcement, onDelete, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      company: '🏢',
      hr: '👔',
      holiday: '🎉',
      birthday: '🎂',
      achievement: '🏆',
      emergency: '🚨',
      policy: '📄'
    };
    return icons[type] || '📢';
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setDeleting(true);
      try {
        await announcementApi.delete(announcement._id);
        toast.success('Announcement deleted successfully');
        if (onDelete) onDelete(announcement._id);
        if (onUpdate) onUpdate();
      } catch (error) {
        toast.error('Failed to delete announcement');
        console.error('Delete error:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleView = () => {
    // Mark as viewed
    if (onUpdate) onUpdate();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
      announcement.isPinned ? 'border-l-4 border-l-indigo-500' : ''
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getTypeIcon(announcement.type)}</span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {announcement.title}
              </h4>
              {announcement.isPinned && (
                <FaThumbtack className="text-indigo-500 text-xs" />
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(announcement.priority)}`}>
                {announcement.priority}
              </span>
              <StatusBadge status={announcement.type} />
            </div>
            <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${
              expanded ? '' : 'line-clamp-2'
            }`}>
              {announcement.content}
            </p>
            {announcement.content.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-1"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
            <button
              onClick={handleView}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="View"
            >
              <FaEye size={14} />
            </button>
            <button
              onClick={() => {/* Edit */}}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Edit"
            >
              <FaEdit size={14} />
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

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <FaUser size={10} />
            <span>{announcement.author?.firstName} {announcement.author?.lastName}</span>
          </span>
          <span className="flex items-center space-x-1">
            <FaCalendarAlt size={10} />
            <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
          </span>
          <span className="flex items-center space-x-1">
            <FaBell size={10} />
            <span>{announcement.views?.length || 0} views</span>
          </span>
          {announcement.department && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              {announcement.department.name}
            </span>
          )}
          {announcement.targetRoles && announcement.targetRoles.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
              {announcement.targetRoles.join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;