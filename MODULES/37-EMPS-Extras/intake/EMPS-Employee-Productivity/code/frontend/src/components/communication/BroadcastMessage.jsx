import React, { useState } from 'react';
import { FaPaperPlane, FaUsers, FaTimes } from 'react-icons/fa';
import { chatApi } from '../../api/chatApi';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BroadcastMessage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);

  const recipientOptions = [
    { value: 'all', label: 'All Employees' },
    { value: 'admin', label: 'Admins' },
    { value: 'hr', label: 'HR Team' },
    { value: 'manager', label: 'Managers' },
    { value: 'employee', label: 'Employees' }
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Please select at least one recipient group');
      return;
    }

    setSending(true);
    try {
      // In a real implementation, you would have a broadcast API
      // await chatApi.sendBroadcast({ message, recipients });
      toast.success('Broadcast message sent successfully');
      setMessage('');
      setRecipients([]);
    } catch (error) {
      toast.error('Failed to send broadcast');
      console.error('Broadcast error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleRecipientToggle = (value) => {
    if (recipients.includes(value)) {
      setRecipients(recipients.filter(r => r !== value));
    } else {
      setRecipients([...recipients, value]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Broadcast Message
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Send a message to all employees or specific groups
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Send to
          </label>
          <div className="flex flex-wrap gap-2">
            {recipientOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRecipientToggle(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  recipients.includes(option.value)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your broadcast message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows="4"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {message.length} characters
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => {
              setMessage('');
              setRecipients([]);
            }}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || recipients.length === 0}
            className={`flex items-center space-x-2 px-6 py-2 text-white rounded-lg transition-colors ${
              sending || !message.trim() || recipients.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaPaperPlane />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastMessage;