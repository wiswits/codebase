import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', event_date: '', event_time: '', venue: '', capacity: 50, type: 'MEETUP', status: 'UPCOMING'
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/events`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert('✅ Event created!');
        fetchEvents();
        setShowForm(false);
        setFormData({ title: '', description: '', event_date: '', event_time: '', venue: '', capacity: 50, type: 'MEETUP', status: 'UPCOMING' });
      }
    } catch (error) {
      alert('❌ Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Event deleted!');
      fetchEvents();
    } catch (error) {
      alert('❌ Failed to delete event');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      UPCOMING: 'bg-green-100 text-green-700',
      ONGOING: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading events...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📅 Events</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Create Event'}
        </button>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Event Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Venue" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="number" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="WEBINAR">Webinar</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="MEETUP">Meetup</option>
                  <option value="CONFERENCE">Conference</option>
                  <option value="REUNION">Reunion</option>
                </select>
                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 col-span-2" rows="3" />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Create Event</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all">
              <h3 className="font-bold text-gray-800 text-lg">{event.title}</h3>
              <p className="text-sm text-gray-500">{event.venue}</p>
              <p className="text-sm text-gray-600 mt-2">{event.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{event.type}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(event.status)}`}>{event.status}</span>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                📅 {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">RSVP</button>
                <button onClick={() => handleDelete(event.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-10 text-gray-500 col-span-3">No events created yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Events;