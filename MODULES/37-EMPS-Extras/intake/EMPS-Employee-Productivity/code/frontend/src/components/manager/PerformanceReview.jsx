import React, { useState } from 'react';
import { FaStar, FaUser, FaCalendarAlt, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PerformanceReview = () => {
  const [reviews, setReviews] = useState([
    { id: 1, employee: 'John Doe', position: 'Software Engineer', reviewDate: '2024-02-15', status: 'pending', rating: 0 },
    { id: 2, employee: 'Jane Smith', position: 'HR Manager', reviewDate: '2024-02-20', status: 'completed', rating: 4 },
    { id: 3, employee: 'Bob Johnson', position: 'Marketing Specialist', reviewDate: '2024-02-25', status: 'pending', rating: 0 }
  ]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    comments: '',
    strengths: '',
    improvements: '',
    goals: ''
  });

  const handleRating = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (formData.rating === 0) {
      toast.warning('Please provide a rating');
      return;
    }
    const updatedReview = { ...selectedReview, status: 'completed', rating: formData.rating, reviewData: formData };
    setReviews(reviews.map(r => r.id === selectedReview.id ? updatedReview : r));
    toast.success('Performance review completed');
    setShowModal(false);
    setSelectedReview(null);
    setFormData({ rating: 0, comments: '', strengths: '', improvements: '', goals: '' });
  };

  const handleStartReview = (review) => {
    setSelectedReview(review);
    setFormData({ rating: 0, comments: '', strengths: '', improvements: '', goals: '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaStar className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Reviews</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-lg">
                  {review.employee.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{review.employee}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{review.position}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {review.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1"><FaCalendarAlt /><span>Review Date: {review.reviewDate}</span></span>
              {review.status === 'completed' && <span className="flex items-center space-x-1 text-yellow-500">⭐ {review.rating}/5</span>}
            </div>
            {review.status === 'pending' && (
              <button onClick={() => handleStartReview(review)} className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <FaEdit /><span>Start Review</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance Review</h3>
              <button onClick={() => { setShowModal(false); setSelectedReview(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">{selectedReview?.employee}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedReview?.position}</p>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating *</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => handleRating(star)} className={`text-3xl transition-colors ${star <= formData.rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}>★</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments</label><textarea name="comments" value={formData.comments} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strengths</label><textarea name="strengths" value={formData.strengths} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Areas for Improvement</label><textarea name="improvements" value={formData.improvements} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goals for Next Period</label><textarea name="goals" value={formData.goals} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" /></div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowModal(false); setSelectedReview(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
              <button onClick={handleSubmit} className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><FaCheck /><span>Submit Review</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReview;