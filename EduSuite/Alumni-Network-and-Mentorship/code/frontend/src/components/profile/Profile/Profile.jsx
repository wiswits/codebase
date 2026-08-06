import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/alumni/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/alumni/profile`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('✅ Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      alert('❌ Failed to update profile');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👤 My Profile</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{profile?.full_name}</h3>
                <p className="text-sm text-gray-500">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {editing ? 'Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Year</label>
                  <input type="number" name="batch_year" value={formData.batch_year || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input type="text" name="course" value={formData.course || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
                  <input type="text" name="current_company" value={formData.current_company || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input type="text" name="industry" value={formData.industry || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea name="bio" value={formData.bio || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" rows="3" />
                </div>
              </div>
              <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors">Save Changes</button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium text-gray-800">{profile?.full_name}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-800">{profile?.email}</p></div>
              <div><p className="text-sm text-gray-500">Batch Year</p><p className="font-medium text-gray-800">{profile?.batch_year || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Course</p><p className="font-medium text-gray-800">{profile?.course || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Company</p><p className="font-medium text-gray-800">{profile?.current_company || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Designation</p><p className="font-medium text-gray-800">{profile?.designation || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Industry</p><p className="font-medium text-gray-800">{profile?.industry || '-'}</p></div>
              <div><p className="text-sm text-gray-500">City</p><p className="font-medium text-gray-800">{profile?.city || '-'}</p></div>
              <div className="md:col-span-2"><p className="text-sm text-gray-500">Bio</p><p className="font-medium text-gray-800">{profile?.bio || '-'}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;