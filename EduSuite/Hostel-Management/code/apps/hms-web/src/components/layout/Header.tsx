import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Bell, 
  Menu, 
  X, 
  Settings,
  HelpCircle,
  ChevronDown,
  Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New leave request pending', read: false },
    { id: 2, message: 'Attendance report ready', read: false },
  ]);

  const handleLogout = () => {
    window.location.href = `${import.meta.env.VITE_APEX_URL}/logout`;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/hostels')) return 'Hostel Management';
    if (path.startsWith('/allocate')) return 'Allocation';
    if (path.startsWith('/attendance')) return 'Attendance';
    if (path.startsWith('/leave')) return 'Leave Management';
    if (path.startsWith('/complaints')) return 'Complaints';
    if (path.startsWith('/reports')) return 'Reports';
    return 'Hostel Management';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-apex-navy text-white z-50 shadow-lg">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Home size={24} className="text-apex-gold" />
            <h1 className="font-display text-xl font-semibold text-apex-gold hidden sm:block">
              Hostel Management
            </h1>
            <span className="text-xs opacity-60 hidden sm:inline">v2.0</span>
          </div>
          <div className="hidden md:block">
            <span className="text-sm text-white/70 ml-4">
              {getPageTitle()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            {unreadCount > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden hidden group-hover:block">
                {notifications.filter(n => !n.read).map(notif => (
                  <div key={notif.id} className="p-3 hover:bg-apex-ivory border-b border-gray-100">
                    <p className="text-sm text-gray-700">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-apex-gold text-apex-navy flex items-center justify-center font-semibold">
                {user?.apexUserId?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline text-sm">
                {user?.apexUserId?.split('-')[0] || 'User'}
              </span>
              <ChevronDown size={16} className="hidden md:block" />
            </button>

            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-medium text-gray-900">User</p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.apexUserId || 'user@example.com'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user?.roles?.map(role => (
                        <span key={role} className="text-xs bg-apex-ivory px-2 py-0.5 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-2">
                    {can('hms:report:read') && (
                      <button 
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-apex-ivory rounded-lg transition-colors"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/reports');
                        }}
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                    )}
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-apex-ivory rounded-lg transition-colors"
                    >
                      <HelpCircle size={16} />
                      Help
                    </button>
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white z-40 md:hidden shadow-xl overflow-y-auto">
            {/* Mobile sidebar content */}
            <nav className="p-4 space-y-1">
              <button 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-apex-ivory rounded-lg transition-colors"
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate('/dashboard');
                }}
              >
                <Home size={20} />
                Dashboard
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-apex-ivory rounded-lg transition-colors"
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate('/hostels');
                }}
              >
                <Building size={20} />
                Hostels
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};