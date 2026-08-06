// frontend/src/components/Support.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Support({ employeeId }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

  const [ticketForm, setTicketForm] = useState({
    subject: '', message: '', category: 'GENERAL', priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/support/tickets/${employeeId}`),
        fetch(`${API_URL}/api/v1/support/tickets/all`)
      ]);
      const myData = await myRes.json();
      const allData = await allRes.json();
      setTickets(myData.data || []);
      setAllTickets(allData.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/support/replies/${ticketId}`);
      const data = await response.json();
      setReplies(data.data || []);
      setSelectedTicket(ticketId);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, ...ticketForm })
      });
      if (response.ok) {
        showToast('✅ Ticket created!', 'success');
        fetchData();
        setShowTicketForm(false);
        setTicketForm({ subject: '', message: '', category: 'GENERAL', priority: 'MEDIUM' });
      }
    } catch (error) {
      showToast('❌ Failed to create ticket', 'error');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/support/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket,
          employee_id: employeeId,
          message: replyMessage
        })
      });
      if (response.ok) {
        showToast('✅ Reply added!', 'success');
        fetchReplies(selectedTicket);
        setReplyMessage('');
        fetchData();
      }
    } catch (error) {
      showToast('❌ Failed to add reply', 'error');
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        showToast(`✅ Ticket ${status}`, 'success');
        fetchData();
        if (selectedTicket) fetchReplies(selectedTicket);
      }
    } catch (error) {
      showToast('❌ Failed to update status', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      GENERAL: '📋',
      TECHNICAL: '💻',
      PAYROLL: '💰',
      LEAVE: '📅',
      HR: '👤'
    };
    return emojis[category] || '📋';
  };

  const displayTickets = viewMode === 'my' ? tickets : allTickets;

  if (loading) return <div className="text-center py-4">Loading tickets...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="font-bold text-gray-800 dark:text-white">💬 Support Center</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('my')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'my' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setShowTicketForm(!showTicketForm)}
            className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700"
          >
            {showTicketForm ? 'Cancel' : '+ New Ticket'}
          </button>
        </div>
      </div>

      {/* Create Ticket Form */}
      {showTicketForm && (
        <form onSubmit={handleTicketSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Subject" value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" required />
            <select value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
              <option value="PAYROLL">Payroll</option>
              <option value="LEAVE">Leave</option>
              <option value="HR">HR</option>
            </select>
            <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <textarea placeholder="Message" value={ticketForm.message} onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="3" required />
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Ticket</button>
        </form>
      )}

      {/* Tickets List */}
      <div className="space-y-3">
        {displayTickets.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">No tickets</div>
        ) : (
          displayTickets.map(ticket => (
            <div
              key={ticket.id}
              className={`bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                ticket.status === 'OPEN' ? 'border-red-300 dark:border-red-700' :
                ticket.status === 'IN_PROGRESS' ? 'border-yellow-300 dark:border-yellow-700' :
                ticket.status === 'RESOLVED' ? 'border-green-300 dark:border-green-700' :
                'border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{getCategoryEmoji(ticket.category)}</span>
                    <h4 className="font-bold text-gray-800 dark:text-white">{ticket.subject}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  {viewMode === 'all' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">By: {ticket.employee_name}</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fetchReplies(ticket.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </button>
                  {viewMode === 'all' && ticket.status !== 'CLOSED' && (
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800 dark:text-white">💬 Ticket Details</h4>
              <button onClick={() => { setSelectedTicket(null); setReplies([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {/* Replies */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {replies.map(reply => (
                <div key={reply.id} className={`p-3 rounded-lg ${reply.employee_id === employeeId ? 'bg-blue-50 dark:bg-blue-900/30 ml-auto max-w-[80%]' : 'bg-gray-50 dark:bg-gray-700 mr-auto max-w-[80%]'}`}>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{reply.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{reply.employee_name} • {new Date(reply.created_at).toLocaleString()}</p>
                </div>
              ))}
              {replies.length === 0 && (
                <div className="text-center text-gray-500 py-4">No replies yet</div>
              )}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleReplySubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Support;