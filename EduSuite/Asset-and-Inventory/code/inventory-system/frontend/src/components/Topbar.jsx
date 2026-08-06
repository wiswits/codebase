import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../api";

const Topbar = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await notificationApi.list();
        setUnread(data.filter((n) => !n.isRead).length);
      } catch {
        // ignore silently, dashboard may be unauthenticated momentarily
      }
    };
    fetchCount();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4">
      <button className="lg:hidden text-gray-500" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      {title ? (
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">{title}</h1>
      ) : (
        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <Link to="/notifications" className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 text-sm">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-gray-600 hover:bg-gray-50"
              >
                <UserIcon size={15} /> Profile & Settings
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
