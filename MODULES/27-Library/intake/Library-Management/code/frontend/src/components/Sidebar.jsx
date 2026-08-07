import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Copy, ListChecks, User, BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const allNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student", "parent"] },
  { to: "/books", label: "Book Catalog", icon: BookOpen, roles: ["admin", "teacher", "student", "parent"] },
  { to: "/copies", label: "Book Copies", icon: Copy, roles: ["admin", "teacher"] },
  { to: "/issue-register", label: "Issue Register", icon: ListChecks, roles: ["admin", "teacher"] },
  { to: "/my-books", label: "My Books", icon: User, roles: ["student", "teacher", "parent"] },
  { to: "/statistics", label: "Statistics", icon: BarChart3, roles: ["admin", "teacher"] },
];

export default function Sidebar() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const items = allNavItems.filter((i) => !role || i.roles.includes(role));

  return (
    <div className="w-64 bg-navy text-slate-300 py-5 flex-shrink-0 min-h-screen">
      <div className="flex items-center gap-2.5 px-5 pb-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BookOpen size={17} color="#fff" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm">EduSuite</div>
          <div className="text-xs text-slate-400">Library Management</div>
        </div>
      </div>

      <div className="px-3 pt-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg text-sm ${
                isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
