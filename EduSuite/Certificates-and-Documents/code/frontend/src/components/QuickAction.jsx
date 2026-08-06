import React from 'react'

const QuickAction = ({ icon: Icon, label }) => {
  return (
    <div className="quick-action">
      <Icon className="w-7 h-7 text-primary" />
      <span className="text-xs font-medium text-gray-700 text-center mt-1">{label}</span>
    </div>
  )
}

export default QuickAction