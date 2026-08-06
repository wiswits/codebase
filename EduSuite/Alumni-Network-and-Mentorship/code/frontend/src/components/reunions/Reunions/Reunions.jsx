import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Reunions() {
  const { user } = useAuth();
  const [reunions, setReunions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ photo_url: '', caption: '' });
  const [formData, setFormData] = useState({
    batch_year: new Date().getFullYear(), name: '', description: '', event_date: '', venue: '', organizer_id: user?.id || '', status: 'PLANNING'
  });

  useEffect(() => { fetchReunions(); }, []);

  const fetchReunions = async () => {
    try {
      const response = await axios.get(`${API_URL}/reunions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReunions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reunions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReunionDetails = async (id) => {
    try {
      const [rsvpsRes, photosRes] = await Promise.all([
        axios.get(`${API_URL}/reunions/${id}/rsvps`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${API_URL}/reunions/${id}/photos`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setRsvps(rsvpsRes.data.data || []);
      setPhotos(photosRes.data.data || []);
      setSelectedReunion(id);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching reunion details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/reunions`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert('✅ Reunion created!');
        fetchReunions();
        setShowForm(false);
        setFormData({ batch_year: new Date().getFullYear(), name: '', description: '', event_date: '', venue: '', organizer_id: user?.id, status: 'PLANNING' });
      }
    } catch (error) {
      alert('❌ Failed to create reunion');
    }
  };

  const handleRSVP = async (reunionId, status) => {
    try {
      await axios.post(`${API_URL}/reunions/${reunionId}/rsvp`, {
        alumni_id: user?.id, status, guests_count: 1
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert(`✅ RSVP ${status}`);
      fetchReunions();
      if (selectedReunion) fetchReunionDetails(selectedReunion);
    } catch (error) {
      alert('❌ Failed to RSVP');
    }
  };

  const handleAddPhoto = async (reunionId) => {
    if (!newPhoto.photo_url.trim()) { alert('Please enter photo URL'); return; }
    try {
      await axios.post(`${API_URL}/reunions/${reunionId}/photos`, {
        photo_url: newPhoto.photo_url, caption: newPhoto.caption, uploaded_by: user?.id
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('✅ Photo added!');
      setNewPhoto({ photo_url: '', caption: '' });
      fetchReunionDetails(reunionId);
    } catch (error) {
      alert('❌ Failed to add photo');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PLANNING: 'bg-gray-100 text-gray-700',
      INVITING: 'bg-blue-100 text-blue-700',
      ONGOING: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-purple-100 text-purple-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading reunions...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🎉 Batch Reunions</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Create Reunion'}
        </button>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Batch Year" value={formData.batch_year} onChange={(e) => setFormData({ ...formData, batch_year: parseInt(e.target.value) })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Reunion Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Venue" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 col-span-2" rows="3" />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Create Reunion</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reunions.map((reunion) => (
            <div key={reunion.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">{reunion.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(reunion.status)}`}>{reunion.status}</span>
              </div>
              <p className="text-sm text-gray-500">Batch {reunion.batch_year}</p>
              <p className="text-sm text-gray-600 mt-2">{reunion.description}</p>
              <div className="mt-3 text-sm text-gray-600">
                📅 {new Date(reunion.event_date).toLocaleDateString()} at {reunion.venue}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => handleRSVP(reunion.id, 'GOING')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">Going</button>
                <button onClick={() => handleRSVP(reunion.id, 'NOT_GOING')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">Not Going</button>
                <button onClick={() => fetchReunionDetails(reunion.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">Details</button>
              </div>
            </div>
          ))}
          {reunions.length === 0 && (
            <div className="text-center py-10 text-gray-500 col-span-3">No reunions created yet</div>
          )}
        </div>

        {/* Reunion Details Modal */}
        {showDetails && selectedReunion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">📋 Reunion Details</h3>
                <button onClick={() => { setShowDetails(false); setSelectedReunion(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <h4 className="font-medium text-gray-700 mb-2">RSVPs ({rsvps.length})</h4>
              <div className="space-y-1 mb-4 max-h-32 overflow-y-auto">
                {rsvps.map((rsvp) => (
                  <div key={rsvp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{rsvp.full_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${rsvp.status === 'GOING' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rsvp.status}</span>
                  </div>
                ))}
              </div>

              <h4 className="font-medium text-gray-700 mb-2">📸 Photos</h4>
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-40 overflow-y-auto">
                {photos.map((photo) => (
                  <img key={photo.id} src={photo.photo_url} alt={photo.caption} className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="Photo URL" value={newPhoto.photo_url} onChange={(e) => setNewPhoto({ ...newPhoto, photo_url: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <input type="text" placeholder="Caption" value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={() => handleAddPhoto(selectedReunion)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reunions;