import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUserCircle } from 'react-icons/fa';

const WelcomeCard = ({ user: propUser, role }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleTitle = () => {
    const titles = {
      admin: 'Administrator',
      hr: 'HR Manager',
      manager: 'Team Manager',
      employee: 'Employee'
    };
    return titles[role || user?.role] || 'Employee';
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex items-center space-x-4">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.firstName}
              className="w-16 h-16 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <FaUserCircle className="w-16 h-16 text-white/80" />
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user?.firstName || 'User'}!
            </h1>
            <p className="text-indigo-100 mt-1">
              {getRoleTitle()} • {user?.employeeId || 'N/A'}
            </p>
            {user?.department && (
              <p className="text-indigo-100 text-sm">
                {user.department.name} • {user.position || 'No Position'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-indigo-100 text-sm">
            Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-indigo-200 text-xs mt-1">
            Welcome back! Here's your overview for today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;