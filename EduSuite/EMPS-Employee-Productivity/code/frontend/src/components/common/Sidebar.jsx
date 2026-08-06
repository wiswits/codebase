import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, 
  FaClipboardCheck, 
  FaTasks, 
  FaCalendarAlt, 
  FaComments, 
  FaBullhorn, 
  FaFileAlt, 
  FaChartBar, 
  FaUser, 
  FaCog, 
  FaUsers, 
  FaUserTie,
  FaUserCheck,
  FaBuilding,
  FaUserPlus,
  FaMapMarkerAlt
} from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Common menu items for all roles
  const commonMenuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/attendance', icon: FaClipboardCheck, label: 'Attendance' },
    { path: '/tasks', icon: FaTasks, label: 'Tasks' },
    { path: '/leave', icon: FaCalendarAlt, label: 'Leave' },
    { path: '/meetings', icon: FaUsers, label: 'Meetings' },
    { path: '/communication', icon: FaComments, label: 'Communication' },
    { path: '/announcements', icon: FaBullhorn, label: 'Announcements' },
    { path: '/documents', icon: FaFileAlt, label: 'Documents' },
    { path: '/reports', icon: FaChartBar, label: 'Reports' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
    { path: '/settings', icon: FaCog, label: 'Settings' },
  ];

  // Update the admin role-specific items
const roleSpecificItems = {
  admin: [
    { path: '/admin', icon: FaUserTie, label: 'Admin Panel' },
    { path: '/admin/employees', icon: FaUsers, label: 'Manage Employees' },
    { path: '/admin/departments', icon: FaBuilding, label: 'Departments' },
    { path: '/admin/office-location', icon: FaMapMarkerAlt, label: 'Office Location' }, // ← ADD THIS
  ],
  hr: [
    { path: '/hr', icon: FaUserTie, label: 'HR Dashboard' },
    { path: '/hr/verification', icon: FaUserCheck, label: 'Verifications' },
    { path: '/hr/recruitment', icon: FaUserPlus, label: 'Recruitment' },
  ],
  manager: [
    { path: '/team', icon: FaUsers, label: 'My Team' },
    { path: '/team/attendance', icon: FaClipboardCheck, label: 'Team Attendance' },
    { path: '/team/tasks', icon: FaTasks, label: 'Team Tasks' },
  ],
  employee: [],
};

  // Build menu based on role
  let menuItems = [...commonMenuItems];
  
  // Insert role-specific items at appropriate positions
  if (user?.role === 'admin') {
    menuItems.splice(8, 0, ...roleSpecificItems.admin);
  } else if (user?.role === 'hr') {
    menuItems.splice(8, 0, ...roleSpecificItems.hr);
  } else if (user?.role === 'manager') {
    menuItems.splice(4, 0, ...roleSpecificItems.manager);
  }

  return (
    <aside className={`fixed left-0 top-16 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    } overflow-y-auto z-40`}>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className={`text-xl ${isOpen ? '' : 'mx-auto'}`} />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;