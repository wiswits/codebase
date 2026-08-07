import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaBell, FaBullhorn } from 'react-icons/fa';
import { announcementApi } from '../../api/announcementApi';
import AnnouncementCard from './AnnouncementCard';
import AnnouncementFilters from './AnnouncementFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    department: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, [filters]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (searchQuery) params.search = searchQuery;
      
      const response = await announcementApi.getAll(params);
      setAnnouncements(response.data || []);
    } catch (err) {
      setError('Failed to load announcements');
      toast.error('Failed to load announcements');
      console.error('Announcement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementApi.delete(id);
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      } catch (error) {
        toast.error('Failed to delete announcement');
        console.error('Delete error:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaBullhorn className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h2>
        </div>
        <button
          onClick={() => navigate('/announcements/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Create Announcement</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaFilter />
          <span>Filters</span>
        </button>
      </div>

      {showFilters && (
        <AnnouncementFilters filters={filters} onFilterChange={handleFilterChange} />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FaBell className="mx-auto text-4xl mb-2" />
          <p className="text-lg">No announcements found</p>
          <p className="text-sm mt-1">Create a new announcement to share with your team</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onDelete={handleDelete}
              onUpdate={fetchAnnouncements}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementList;