import React from 'react'

const iconColors = {
  certificate: 'bg-secondary/20 text-secondary',
  template: 'bg-blue-50 text-blue-600',
  idcard: 'bg-emerald-50 text-emerald-600',
  download: 'bg-amber-50 text-amber-600',
  default: 'bg-gray-100 text-gray-600'
}

const ActivityItem = ({ type, icon: Icon, title, description, time }) => {
  const colorClass = iconColors[type] || iconColors.default

  return (
    <div className="flex items-start gap-3 border-b border-[#f0f2f5] pb-3 last:border-0 last:pb-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-800">{title}</div>
        <div className="text-xs text-gray-400">{description} • {time}</div>
      </div>
    </div>
  )
}

export default ActivityItem