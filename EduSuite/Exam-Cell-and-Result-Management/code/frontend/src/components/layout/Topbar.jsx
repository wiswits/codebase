import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Menu, Bell, Search, LogOut, ChevronDown, Moon, Sun, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ROLE_LABELS } from '../../constants/index.js';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications.js';

const TYPE_DOT = { info: 'bg-sky-400', success: 'bg-primary-500', warning: 'bg-amber-400', error: 'bg-rose-500' };

export const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdown, setDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifData?.unreadCount || 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-700">
          <Menu size={22} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 w-full max-w-xs">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition text-slate-500"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setDropdown(false);
            }}
            className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition text-slate-500"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifData?.data?.length ? (
                  notifData.data.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => !n.read && markRead.mutate(n._id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition flex gap-2.5 ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${TYPE_DOT[n.type] || TYPE_DOT.info}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setDropdown((d) => !d);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 transition"
          >
            <div className="h-9 w-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 leading-tight">{ROLE_LABELS[user?.role] || 'Admin'}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {dropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-slate-100 py-1.5 overflow-hidden">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
