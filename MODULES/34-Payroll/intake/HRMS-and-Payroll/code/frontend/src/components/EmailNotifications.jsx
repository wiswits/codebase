// frontend/src/components/EmailNotifications.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function EmailNotifications() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    recipient_email: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/email/logs`);
      const data = await response.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showToast('✅ Email sent!', 'success');
        fetchLogs();
        setFormData({ recipient_email: '', subject: '', body: '' });
      }
    } catch (error) {
      showToast('❌ Failed to send email', 'error');
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4">📧 Email Notifications</h3>

      {/* Send Email Form */}
      <form onSubmit={handleSendEmail} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="email"
            placeholder="Recipient Email"
            value={formData.recipient_email}
            onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
            required
          />
          <textarea
            placeholder="Email Body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
            rows="4"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Send Email
          </button>
        </div>
      </form>

      {/* Email Logs */}
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">📋 Email Logs</h4>
      {logs.map(log => (
        <div key={log.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2">
          <div>
            <span className="font-medium text-gray-800 dark:text-white">{log.subject}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{log.recipient_email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${
              log.status === 'SENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              log.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            }`}>
              {log.status}
            </span>
            <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmailNotifications;