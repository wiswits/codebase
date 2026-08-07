import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUserCircle, 
  FaCog, 
  FaSignOutAlt, 
  FaUser, 
  FaFileAlt,
  FaShieldAlt
} from 'react-icons/fa';

const ProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {user?.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.firstName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="text-gray-600 dark:text-gray-300 text-2xl" />
        )}
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {user?.firstName} {user?.lastName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.employeeId} • {user?.role?.toUpperCase()}
            </p>
            {user?.department && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.department.name}
              </p>
            )}
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <FaUser className="mr-3 text-gray-400" />
              My Profile
            </Link>
            <Link
              to="/documents"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <FaFileAlt className="mr-3 text-gray-400" />
              My Documents
            </Link>
            <Link
              to="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <FaCog className="mr-3 text-gray-400" />
              Settings
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <FaShieldAlt className="mr-3 text-gray-400" />
                Admin Panel
              </Link>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FaSignOutAlt className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;