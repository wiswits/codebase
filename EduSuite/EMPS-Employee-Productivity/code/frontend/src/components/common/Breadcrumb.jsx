import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const getLabel = (path) => {
    const labels = {
      'dashboard': 'Dashboard',
      'attendance': 'Attendance',
      'tasks': 'Tasks',
      'leave': 'Leave',
      'meetings': 'Meetings',
      'communication': 'Communication',
      'announcements': 'Announcements',
      'documents': 'Documents',
      'reports': 'Reports',
      'profile': 'Profile',
      'settings': 'Settings',
      'admin': 'Admin Panel',
      'team': 'My Team'
    };
    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
        <FaHome className="text-gray-500 dark:text-gray-400" />
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={name}>
            <FaChevronRight className="text-gray-400 dark:text-gray-600 text-xs" />
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {getLabel(name)}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {getLabel(name)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;