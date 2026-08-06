import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaPlus, 
  FaCheck, 
  FaCalendarPlus, 
  FaFileAlt, 
  FaUsers,
  FaUserPlus,
  FaClipboardCheck,
  FaComments,
  FaUserCheck,
  FaBuilding,
  FaChartLine
} from 'react-icons/fa';

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const getActions = () => {
    // Common actions for all users
    const commonActions = [
      { label: 'Check In', icon: FaClipboardCheck, path: '/attendance', color: 'bg-green-500' },
      { label: 'Apply Leave', icon: FaCalendarPlus, path: '/leave', color: 'bg-blue-500' },
    ];

    // Role-specific actions
    const roleActions = {
      admin: [
        ...commonActions,
        { label: 'Add Employee', icon: FaUserPlus, path: '/admin/employees/add', color: 'bg-purple-500' },
        { label: 'Create Task', icon: FaPlus, path: '/tasks/create', color: 'bg-indigo-500' },
        { label: 'Manage Departments', icon: FaBuilding, path: '/admin/departments', color: 'bg-orange-500' },
        { label: 'View Analytics', icon: FaChartLine, path: '/admin/analytics', color: 'bg-red-500' },
      ],
      hr: [
        ...commonActions,
        { label: 'Add Employee', icon: FaUserPlus, path: '/hr/employees/add', color: 'bg-purple-500' },
        { label: 'Create Announcement', icon: FaFileAlt, path: '/announcements/create', color: 'bg-indigo-500' },
        { label: 'Verify Employee', icon: FaUserCheck, path: '/hr/verification', color: 'bg-orange-500' },
        { label: 'Recruitment', icon: FaUsers, path: '/hr/recruitment', color: 'bg-pink-500' },
      ],
      manager: [
        ...commonActions,
        { label: 'Create Task', icon: FaPlus, path: '/tasks/create', color: 'bg-purple-500' },
        { label: 'Schedule Meeting', icon: FaCalendarPlus, path: '/meetings/create', color: 'bg-indigo-500' },
        { label: 'Team Chat', icon: FaComments, path: '/communication', color: 'bg-orange-500' },
        { label: 'Team Attendance', icon: FaClipboardCheck, path: '/team/attendance', color: 'bg-teal-500' },
      ],
      employee: [
        ...commonActions,
        { label: 'My Tasks', icon: FaCheck, path: '/tasks', color: 'bg-purple-500' },
        { label: 'Submit Report', icon: FaFileAlt, path: '/reports/daily', color: 'bg-indigo-500' },
      ]
    };

    return roleActions[role] || commonActions;
  };

  const actions = getActions();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className={`${action.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform`}>
              <action.icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;