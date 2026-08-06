// frontend/src/components/Profile.jsx
import { useState, useEffect } from 'react';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/employees`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setProfile(data.data[0]);
        setFormData(data.data[0]);
      }
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
      const response = await fetch(`${API_URL}/api/v1/employees/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('✅ Profile updated!');
        setProfile(formData);
        setEditing(false);
      } else {
        alert('❌ Failed to update profile');
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading profile...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">👤 My Profile</h2>
        <button onClick={() => setEditing(!editing)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{editing ? 'Cancel' : '✏️ Edit Profile'}</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label><input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label><input type="text" name="department" value={formData.department || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" /></div>
            </div>
            <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Changes</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Employee Code</p><p className="font-medium text-gray-800 dark:text-white">{profile?.employee_code}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Name</p><p className="font-medium text-gray-800 dark:text-white">{profile?.first_name} {profile?.last_name || ''}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Email</p><p className="font-medium text-gray-800 dark:text-white">{profile?.email}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Phone</p><p className="font-medium text-gray-800 dark:text-white">{profile?.phone || '-'}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Designation</p><p className="font-medium text-gray-800 dark:text-white">{profile?.designation || '-'}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Department</p><p className="font-medium text-gray-800 dark:text-white">{profile?.department || '-'}</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Date of Joining</p><p className="font-medium text-gray-800 dark:text-white">{profile?.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString() : '-'}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;