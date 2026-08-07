import React from 'react'
import { TrendingUp } from 'lucide-react'

const StatCard = ({ label, value, trend, icon: Icon }) => {
  const isPositive = typeof trend === 'number' && trend > 0
  const trendText = typeof trend === 'number' 
    ? `${isPositive ? '↑' : '↓'} ${Math.abs(trend)}% from last month`
    : trend

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className="w-5 h-5 text-secondary/70" />
      </div>
      <div className="text-3xl font-bold text-primary mt-2">{value.toLocaleString()}</div>
      <div className="flex items-center gap-2 text-xs mt-1">
        <span className={`font-medium ${isPositive ? 'text-emerald-600' : 'text-gray-400'}`}>
          {trendText}
        </span>
      </div>
    </div>
  )
}

export default StatCard