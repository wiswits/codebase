// frontend/src/components/directory/Directory/Directory.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const API_URL = 'http://localhost:5000/api/v1';

function Directory() {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', batch: '', city: '', industry: '', company: '' });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.city) params.append('city', filters.city);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.company) params.append('company', filters.company);

      const response = await axios.get(`${API_URL}/alumni/directory?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAlumni(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAlumni();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👥 Alumni Directory</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                name="search"
                placeholder="🔍 Search by name, company..."
                value={filters.search}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="batch"
                placeholder="Batch Year"
                value={filters.batch}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={filters.city}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="industry"
                placeholder="Industry"
                value={filters.industry}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="company"
                placeholder="Company"
                value={filters.company}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
              🔍 Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : alumni.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No alumni found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map((alumnus) => (
              <div key={alumnus.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                    {alumnus.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{alumnus.full_name}</h4>
                    <p className="text-sm text-gray-500">{alumnus.batch_year} • {alumnus.course}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">{alumnus.designation || 'Student'}</p>
                  <p className="text-gray-500">{alumnus.current_company || 'Not employed'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {alumnus.verification_status === 'VERIFIED' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Verified</span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{alumnus.city || 'Unknown'}</span>
                  </div>
                  <Link to={`/alumni/${alumnus.id}`} className="text-blue-600 hover:text-blue-800 text-sm mt-2 block">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Directory;