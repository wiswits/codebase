import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, bg, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3.5 items-start">
      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}
