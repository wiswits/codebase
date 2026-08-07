// frontend/src/components/mentorship/Mentorship/Mentorship.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/v1';

function Mentorship() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const [offerForm, setOfferForm] = useState({
    alumni_id: user?.id || '',
    topic: '',
    description: '',
    industry: '',
    availability: '',
    max_students: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [offersRes, myOffersRes, requestsRes, myRequestsRes] = await Promise.all([
        axios.get(`${API_URL}/mentorship/offers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/mentorship/offers/alumni/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/mentorship/requests/pending/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/mentorship/requests/student/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setOffers(offersRes.data.data || []);
      setMyOffers(myOffersRes.data.data || []);
      setRequests(requestsRes.data.data || []);
      setMyRequests(myRequestsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/mentorship/offers`, offerForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert('✅ Mentorship offer created!');
        fetchData();
        setShowOfferForm(false);
        setOfferForm({ alumni_id: user?.id, topic: '', description: '', industry: '', availability: '', max_students: 5 });
      }
    } catch (error) {
      alert('❌ Failed to create offer');
    }
  };

  const handleRequest = async (offerId) => {
    if (!requestMessage.trim()) {
      alert('Please write a message');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/mentorship/requests`, {
        offer_id: offerId,
        student_id: user?.id,
        message: requestMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.status === 201) {
        alert('✅ Mentorship request sent!');
        fetchData();
        setRequestMessage('');
      }
    } catch (error) {
      alert('❌ ' + (error.response?.data?.error?.message || 'Failed to send request'));
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await axios.put(`${API_URL}/mentorship/requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`✅ Request ${status.toLowerCase()}`);
      fetchData();
    } catch (error) {
      alert('❌ Failed to update request');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🤝 Mentorship Marketplace</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Dashboard</Link>
        </div>

        {/* Create Offer Button */}
        {user?.role === 'ALUMNI' && (
          <button
            onClick={() => setShowOfferForm(!showOfferForm)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            {showOfferForm ? 'Cancel' : '+ Offer Mentorship'}
          </button>
        )}

        {/* Offer Form */}
        {showOfferForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">📝 Create Mentorship Offer</h3>
            <form onSubmit={handleOfferSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Topic (e.g. Career in Tech)"
                  value={offerForm.topic}
                  onChange={(e) => setOfferForm({ ...offerForm, topic: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Industry (e.g. IT, Finance)"
                  value={offerForm.industry}
                  onChange={(e) => setOfferForm({ ...offerForm, industry: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Availability (e.g. Weekends, Evenings)"
                  value={offerForm.availability}
                  onChange={(e) => setOfferForm({ ...offerForm, availability: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Max Students"
                  value={offerForm.max_students}
                  onChange={(e) => setOfferForm({ ...offerForm, max_students: parseInt(e.target.value) })}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 col-span-2"
                  rows="3"
                  required
                />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                Create Offer
              </button>
            </form>
          </div>
        )}

        {/* Pending Requests for Alumni */}
        {user?.role === 'ALUMNI' && requests.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">⏳ Pending Mentorship Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
                  <p className="font-medium text-gray-800">{req.full_name}</p>
                  <p className="text-sm text-gray-600">{req.message}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRequestAction(req.id, 'ACCEPTED')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.id, 'REJECTED')}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Offers */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">📋 Available Mentorship Offers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{offer.topic}</h4>
                    <p className="text-sm text-gray-500">By {offer.full_name}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{offer.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{offer.industry}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{offer.availability}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Max {offer.max_students} students</span>
                </div>
                {user?.role === 'STUDENT' && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Why do you want this mentorship?"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                    <button
                      onClick={() => handleRequest(offer.id)}
                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Request Mentorship
                    </button>
                  </div>
                )}
              </div>
            ))}
            {offers.length === 0 && (
              <div className="text-center py-10 text-gray-500 col-span-3">No mentorship offers available yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Mentorship;