import { NavLink } from "react-router-dom";

import {
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  Settings,
  CalendarCheck,
} from "lucide-react";

const workspaceLinks = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    path: "/events",
    icon: CalendarDays,
  },
  {
    label: "Resources",
    path: "/resources",
    icon: Boxes,
  },
  {
    label: "Bookings",
    path: "/bookings",
    icon: CalendarCheck,
  },
];

const systemLinks = [
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    path: "/help",
    icon: CircleHelp,
  },
];

export default function Sidebar({
  collapsed = false,
  onToggle,
}) {
  function renderLink({
    label,
    path,
    icon: Icon,
  }) {
    return (
      <NavLink
        key={path}
        to={path}
        end={path === "/dashboard"}
        title={
          collapsed ? label : undefined
        }
        className={({ isActive }) =>
          `sidebar-link ${
            isActive ? "active" : ""
          }`
        }
      >
        <Icon size={20} />

        {!collapsed && (
          <span>{label}</span>
        )}
      </NavLink>
    );
  }

  return (
    <aside
      className={`sidebar ${
        collapsed
          ? "sidebar-is-collapsed"
          : ""
      }`}
    >
      <div className="sidebar-brand">
        <div className="brand-icon">
          <GraduationCap size={27} />
        </div>

        {!collapsed && (
          <div className="brand-copy">
            <strong>WisWits</strong>
            <span>
              Event Management
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-navigation">
        {!collapsed && (
          <span className="sidebar-section-title">
            WORKSPACE
          </span>
        )}

        <div className="sidebar-links">
          {workspaceLinks.map(renderLink)}
        </div>

        {!collapsed && (
          <span className="sidebar-section-title sidebar-system-title">
            SYSTEM
          </span>
        )}

        <div className="sidebar-links">
          {systemLinks.map(renderLink)}
        </div>
      </nav>

      <div className="sidebar-footer">
  {!collapsed ? (
    <div className="sidebar-footer-card">
      <div className="system-status">
        <span className="status-dot" />

        <div className="system-status-copy">
          <strong>All systems operational</strong>
          <span>Backend connected</span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  ) : (
    <button
      type="button"
      className="sidebar-toggle sidebar-toggle-collapsed"
      onClick={onToggle}
      aria-label="Expand sidebar"
      title="Expand sidebar"
    >
      <ChevronRight size={18} />
    </button>
  )}
</div>
    </aside>
  );
}