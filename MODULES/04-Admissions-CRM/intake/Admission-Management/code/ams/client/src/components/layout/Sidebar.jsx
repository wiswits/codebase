import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderCheck,
  ClipboardList,
  CalendarDays,
  Send,
  GraduationCap,
  PieChart,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/enquiries', label: 'Enquiries', icon: Users },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/documents', label: 'Documents', icon: FolderCheck },
  { to: '/entrance-test', label: 'Entrance Test', icon: ClipboardList },
  { to: '/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/offers', label: 'Offers', icon: Send },
  { to: '/admissions', label: 'Admission', icon: GraduationCap },
  { to: '/quotas', label: 'Quotas & Seats', icon: PieChart },
  { to: '/analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-[#0f1c3f] text-slate-200 flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">AMS</p>
            <p className="text-[11px] text-slate-400 leading-tight">Admission Management</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-[11px] text-slate-500">
          EduSuite AMS v1.0 &middot; Admission Session {import.meta.env.VITE_CURRENT_FY || '2026-27'}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
