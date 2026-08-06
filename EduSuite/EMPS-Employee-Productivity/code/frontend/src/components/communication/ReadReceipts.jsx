import React, { useState } from 'react';
import { FaCheck, FaCheckDouble, FaUser, FaClock } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const ReadReceipts = ({ message }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!message) return null;

  const readCount = message.readBy?.length || 0;
  const totalRecipients = message.deliveredTo?.length || 0;
  const isRead = readCount > 0;
  const isDelivered = totalRecipients > 0;

  const getStatusIcon = () => {
    if (isRead) {
      return <FaCheckDouble className="text-green-500" />;
    }
    if (isDelivered) {
      return <FaCheck className="text-blue-500" />;
    }
    return <FaClock className="text-gray-400" />;
  };

  const getStatusText = () => {
    if (isRead) {
      return `Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`;
    }
    if (isDelivered) {
      return `Delivered to ${totalRecipients} ${totalRecipients === 1 ? 'person' : 'people'}`;
    }
    return 'Sent';
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      {showDetails && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message Status
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className="text-gray-900 dark:text-white">
                {message.isDeleted ? 'Deleted' : 'Active'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Sent</span>
              <span className="text-gray-900 dark:text-white">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </span>
            </div>
            {message.deliveredTo && message.deliveredTo.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivered To:
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {message.deliveredTo.map((delivery, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {delivery.user?.firstName || 'Unknown'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(new Date(delivery.deliveredAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {message.readBy && message.readBy.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Read By:
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {message.readBy.map((read, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {read.user?.firstName || 'Unknown'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(new Date(read.readAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadReceipts;