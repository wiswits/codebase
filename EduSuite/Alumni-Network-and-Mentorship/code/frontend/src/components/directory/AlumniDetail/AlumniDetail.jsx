import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function AlumniDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumni();
  }, [id]);

  const fetchAlumni = async () => {
    try {
      const response = await axios.get(`${API_URL}/alumni/profile/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAlumni(response.data.data);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;
  if (!alumni) return <div className="text-center py-10 text-gray-500">Alumni not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👤 Alumni Details</h2>
          <Link to="/directory" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Directory</Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
              {alumni.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{alumni.full_name}</h3>
              <p className="text-gray-500">{alumni.role}</p>
              {alumni.verification_status === 'VERIFIED' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Verified</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-800">{alumni.email}</p></div>
            <div><p className="text-sm text-gray-500">Batch Year</p><p className="font-medium text-gray-800">{alumni.batch_year || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Course</p><p className="font-medium text-gray-800">{alumni.course || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Current Company</p><p className="font-medium text-gray-800">{alumni.current_company || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Designation</p><p className="font-medium text-gray-800">{alumni.designation || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Industry</p><p className="font-medium text-gray-800">{alumni.industry || '-'}</p></div>
            <div><p className="text-sm text-gray-500">City</p><p className="font-medium text-gray-800">{alumni.city || '-'}</p></div>
            <div><p className="text-sm text-gray-500">Country</p><p className="font-medium text-gray-800">{alumni.country || '-'}</p></div>
            <div className="md:col-span-2"><p className="text-sm text-gray-500">Bio</p><p className="font-medium text-gray-800">{alumni.bio || '-'}</p></div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">LinkedIn</p>
              <a href={alumni.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{alumni.linkedin_url || '-'}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlumniDetail;