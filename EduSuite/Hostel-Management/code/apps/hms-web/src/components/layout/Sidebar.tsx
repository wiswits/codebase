import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Bed,
  Users,
  CalendarCheck,
  FileText,
  AlertCircle,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
  subItems?: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { can } = usePermissions();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
    },
    {
      path: '/hostels',
      icon: <Building2 size={20} />,
      label: 'Hostels',
      permission: 'hms:hostel:read',
      subItems: [
        { path: '/hostels', icon: <Building2 size={16} />, label: 'All Hostels' },
        { path: '/hostels/new', icon: <Building2 size={16} />, label: 'Add Hostel' },
      ],
    },
    {
      path: '/allocate',
      icon: <Bed size={20} />,
      label: 'Allocation',
      permission: 'hms:allocation:create',
      subItems: [
        { path: '/allocate', icon: <Bed size={16} />, label: 'Allocate Bed' },
        { path: '/transfers', icon: <Users size={16} />, label: 'Transfers' },
      ],
    },
    {
      path: '/attendance',
      icon: <CalendarCheck size={20} />,
      label: 'Attendance',
      permission: 'hms:attendance:read',
      subItems: [
        { path: '/attendance', icon: <CalendarCheck size={16} />, label: 'Take Attendance' },
        { path: '/attendance/reports', icon: <BarChart3 size={16} />, label: 'Reports' },
      ],
    },
    {
      path: '/leave',
      icon: <FileText size={20} />,
      label: 'Leave',
      permission: 'hms:leave:read',
      subItems: [
        { path: '/leave', icon: <FileText size={16} />, label: 'Requests' },
        { path: '/leave/gate-pass', icon: <FileText size={16} />, label: 'Gate Pass' },
      ],
    },
    {
      path: '/complaints',
      icon: <AlertCircle size={20} />,
      label: 'Complaints',
      permission: 'hms:complaint:read',
      subItems: [
        { path: '/complaints', icon: <AlertCircle size={16} />, label: 'All Complaints' },
        { path: '/complaints/new', icon: <AlertCircle size={16} />, label: 'Raise Complaint' },
      ],
    },
    {
      path: '/reports',
      icon: <BarChart3 size={20} />,
      label: 'Reports',
      permission: 'hms:report:read',
      subItems: [
        { path: '/reports/occupancy', icon: <BarChart3 size={16} />, label: 'Occupancy' },
        { path: '/reports/attendance', icon: <BarChart3 size={16} />, label: 'Attendance' },
        { path: '/reports/revenue', icon: <BarChart3 size={16} />, label: 'Revenue' },
      ],
    },
  ];

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const visibleItems = navItems.filter(item =>
    !item.permission || can(item.permission)
  );

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = location.pathname === item.path || 
      (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
    const isExpanded = expandedItems.includes(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.path} className="space-y-1">
        {hasSubItems ? (
          <>
            <button
              onClick={() => toggleExpand(item.path)}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-apex-navy text-white' : 'text-gray-700 hover:bg-apex-ivory'}
                ${depth > 0 ? 'ml-4 text-sm' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </div>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isExpanded && (
              <div className="space-y-1">
                {item.subItems?.map(subItem => renderNavItem(subItem, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
              ${isActive ? 'bg-apex-navy text-white' : 'text-gray-700 hover:bg-apex-ivory'}
              ${depth > 0 ? 'ml-8 text-sm' : ''}
            `}
          >
            <span className={isActive ? 'text-white' : 'text-gray-400'}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
      <nav className="p-4 space-y-1">
        {visibleItems.map(item => renderNavItem(item))}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>HMS v2.0</span>
          <div className="flex gap-2">
            <button className="hover:text-apex-navy transition-colors">
              <HelpCircle size={14} />
            </button>
            <button className="hover:text-apex-navy transition-colors">
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};