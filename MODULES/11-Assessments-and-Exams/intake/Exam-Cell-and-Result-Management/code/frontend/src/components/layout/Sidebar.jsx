import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { SIDEBAR_LINKS, STUDENT_SIDEBAR_LINKS } from '../../constants/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const links = user?.role === 'student' ? STUDENT_SIDEBAR_LINKS : SIDEBAR_LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 z-50 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-100 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">ECRMS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const Icon = Icons[link.icon] || Icons.Circle;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-emerald-50 p-4">
            <p className="text-xs font-semibold text-primary-700">ECRMS v1.0</p>
            <p className="text-xs text-slate-500 mt-1">Exam & Result Management System</p>
          </div>
        </div>
      </aside>
    </>
  );
};
