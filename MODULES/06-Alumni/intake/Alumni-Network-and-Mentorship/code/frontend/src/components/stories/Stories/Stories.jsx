  import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [pendingStories, setPendingStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [formData, setFormData] = useState({
    alumni_id: user?.id || '', title: '', category: '', content: '', image_url: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [storiesRes, myRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/stories`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/stories/my/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/stories/pending`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStories(storiesRes.data.data || []);
      setMyStories(myRes.data.data || []);
      setPendingStories(pendingRes.data.data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/stories`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert('✅ Story submitted for review!');
        fetchData();
        setShowForm(false);
        setFormData({ alumni_id: user?.id, title: '', category: '', content: '', image_url: '' });
      }
    } catch (error) {
      alert('❌ Failed to submit story');
    }
  };

  const handleModerate = async (id, status) => {
    try {
      await axios.put(`${API_URL}/stories/${id}/moderate`, { status, approved_by: user?.id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Story ${status.toLowerCase()}`);
      fetchData();
    } catch (error) {
      alert('❌ Failed to moderate story');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`${API_URL}/stories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Story deleted!');
      fetchData();
    } catch (error) {
      alert('❌ Failed to delete story');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      FEATURED: 'bg-blue-100 text-blue-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading stories...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📖 Success Stories</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-lg text-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>All Stories</button>
          <button onClick={() => setViewMode('my')} className={`px-4 py-2 rounded-lg text-sm ${viewMode === 'my' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>My Stories</button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setViewMode('pending')} className={`px-4 py-2 rounded-lg text-sm ${viewMode === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
              Pending ({pendingStories.length})
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Submit Story</button>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Story Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Image URL" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                <textarea placeholder="Your Success Story..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 col-span-2" rows="4" required />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Submit Story</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const displayStories = viewMode === 'all' ? stories : viewMode === 'my' ? myStories : pendingStories;
            return displayStories.length === 0 ? (
              <div className="text-center py-10 text-gray-500 col-span-3">No stories found</div>
            ) : (
              displayStories.map((story) => (
                <div key={story.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all">
                  {story.image_url && (
                    <img src={story.image_url} alt={story.title} className="w-full h-40 object-cover rounded-xl mb-4" />
                  )}
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{story.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(story.status)}`}>{story.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">By {story.author_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{story.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{story.category}</span>
                  </div>
                  {viewMode === 'pending' && user?.role === 'ADMIN' && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleModerate(story.id, 'APPROVED')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Approve</button>
                      <button onClick={() => handleModerate(story.id, 'FEATURED')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Feature</button>
                      <button onClick={() => handleModerate(story.id, 'REJECTED')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Reject</button>
                    </div>
                  )}
                  {viewMode === 'my' && (
                    <button onClick={() => handleDelete(story.id)} className="mt-3 text-red-500 hover:text-red-700 text-sm">Delete</button>
                  )}
                </div>
              ))
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default Stories;