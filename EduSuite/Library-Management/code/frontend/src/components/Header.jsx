import React, { useState } from "react";
import { ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleColors = {
  admin: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  student: "bg-green-100 text-green-700",
  parent: "bg-amber-100 text-amber-700",
};

export default function Header() {
  const { demoUsers, currentUser, switchUser } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-7 py-4 bg-white border-b border-gray-200">
      <div>
        <span className="text-xs text-gray-400">Dev mode — real login not built yet (see PRD section 11)</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <UserCircle size={26} className="text-gray-400" />
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-900">{currentUser?.name || "Select user"}</div>
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${roleColors[currentUser?.role] || "bg-gray-100 text-gray-600"}`}>
              {currentUser?.role || "none"}
            </span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 text-xs text-gray-400 border-b">Switch demo user (role switcher)</div>
            {demoUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  switchUser(u._id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-sm ${
                  currentUser?._id === u._id ? "bg-blue-50" : ""
                }`}
              >
                <span className="text-gray-900">{u.name}{u.studentCode ? ` (${u.studentCode})` : ""}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${roleColors[u.role]}`}>{u.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
