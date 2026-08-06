// frontend/src/components/dashboard/Dashboard/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

function Dashboard() {
  const { user, logout } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState({
    alumni: 0,
    mentorship: 0,
    events: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch alumni
      const alumniRes = await axios.get(`${API_URL}/alumni/directory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const alumniData = alumniRes.data.data || [];
      setAlumni(alumniData);

      // Fetch events
      const eventsRes = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventsData = eventsRes.data.data || [];
      const upcomingEvents = eventsData.filter(e => e.status === 'UPCOMING').length;

      // Fetch mentorship offers
      const mentorshipRes = await axios.get(`${API_URL}/mentorship/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mentorshipData = mentorshipRes.data.data || [];

      // Fetch pending mentorship requests
      let pendingRequests = 0;
      if (user?.role === 'ALUMNI') {
        const pendingRes = await axios.get(`${API_URL}/mentorship/requests/pending/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        pendingRequests = pendingRes.data.data?.length || 0;
      }

      setStats({
        alumni: alumniData.length,
        mentorship: mentorshipData.length,
        events: upcomingEvents,
        pending: pendingRequests
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { icon: '👥', label: 'Total Alumni', value: stats.alumni, color: 'blue' },
    { icon: '🤝', label: 'Mentorship Matches', value: stats.mentorship, color: 'green' },
    { icon: '📅', label: 'Upcoming Events', value: stats.events, color: 'purple' },
    { icon: '⏳', label: 'Pending Requests', value: stats.pending, color: 'orange' },
  ];

  const quickActions = [
    { icon: '👥', label: 'Alumni', link: '/directory', color: 'blue' },
    { icon: '👤', label: 'Profile', link: '/profile', color: 'purple' },
    { icon: '🤝', label: 'Mentorship', link: '/mentorship', color: 'green' },
    { icon: '📅', label: 'Events', link: '/events', color: 'pink' },
    { icon: '📖', label: 'Stories', link: '/stories', color: 'pink' },
    { icon: '💰', label: 'Donations', link: '/donations', color: 'teal' },
    { icon: '🎉', label: 'Reunions', link: '/reunions', color: 'purple' },
    { icon: '📊', label: 'Reports', link: '/reports', color: 'orange' },
    { icon: '📥', label: 'Import', link: '/import', color: 'gray' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-100',
    green: 'bg-green-50 hover:bg-green-100 border-green-100',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-100',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-100',
    pink: 'bg-pink-50 hover:bg-pink-100 border-pink-100',
    teal: 'bg-teal-50 hover:bg-teal-100 border-teal-100',
    gray: 'bg-gray-50 hover:bg-gray-100 border-gray-100',
  };

  const iconColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
    gray: 'bg-gray-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-gray-800">Alumni Network</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">👋 Welcome, {user?.full_name}!</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user?.full_name}! 🎉</h1>
          <p className="text-blue-100 mt-1">Here's what's happening with your organization today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`${iconColors[stat.color]} p-3 rounded-xl text-white text-2xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`p-4 ${colorClasses[action.color]} rounded-xl hover:shadow-md transition-all text-center border`}
              >
                <div className="text-2xl mb-1">{action.icon}</div>
                <span className="text-xs text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Alumni List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="font-bold text-gray-800">👥 Alumni List</h2>
            <Link
              to="/directory"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <span>➕</span> View All
            </Link>
          </div>

          {alumni.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alumni yet. Start building your network!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alumni.slice(0, 5).map((alumnus) => (
                    <tr key={alumnus.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {alumnus.full_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        {alumnus.batch_year || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {alumnus.current_company || '-'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {alumnus.verification_status === 'VERIFIED' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Verified</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/alumni/${alumnus.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {alumni.length > 5 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Showing 5 of {alumni.length} alumni
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;