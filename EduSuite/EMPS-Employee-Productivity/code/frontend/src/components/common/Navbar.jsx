import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaUserCircle,
  FaBars,
  FaSignOutAlt,
  FaCog,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBell from './NotificationBell';
import ProfileDropdown from './ProfileDropdown';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-50 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaBars className="text-gray-600 dark:text-gray-300 text-xl" />
          </button>
          
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EMPS</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
              EMPS
            </span>
          </Link>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden lg:block">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search employees, tasks, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          </form>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <FaSun className="text-yellow-400 text-xl" />
            ) : (
              <FaMoon className="text-gray-600 text-xl" />
            )}
          </button>

          <Link to="/communication" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <FaEnvelope className="text-gray-600 dark:text-gray-300 text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>

          <NotificationBell />

          <ProfileDropdown user={user} onLogout={handleLogout} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;