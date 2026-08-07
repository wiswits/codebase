import React from 'react';

export const Card = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 lg:px-5 py-3.5 border-b border-gray-100">
        {title && <h3 className="font-semibold text-gray-800 text-sm lg:text-base">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-4 lg:p-5">{children}</div>
  </div>
);

export const StatCard = ({ label, value, delta, deltaLabel = 'vs last 7 days', accent = 'blue' }) => {
  const accents = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  const positive = typeof delta === 'number' ? delta >= 0 : true;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accents[accent]}`}>{value}</p>
      {delta !== undefined && (
        <p className={`text-xs mt-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? '\u2191' : '\u2193'} {Math.abs(delta)}% {deltaLabel}
        </p>
      )}
    </div>
  );
};

const BADGE_STYLES = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

// Maps common status strings to a sensible color without the caller needing to know every value
const STATUS_COLOR_MAP = {
  Draft: 'gray',
  Submitted: 'blue',
  New: 'blue',
  Contacted: 'purple',
  'Follow-up': 'amber',
  Interested: 'blue',
  'Application Started': 'purple',
  Converted: 'green',
  Lost: 'red',
  'Documents Pending': 'amber',
  'Documents Verified': 'green',
  'Test Scheduled': 'blue',
  'Test Qualified': 'green',
  'Below Cutoff': 'red',
  'Interview Scheduled': 'blue',
  Interviewed: 'purple',
  'Offer Sent': 'amber',
  Accepted: 'green',
  Rejected: 'red',
  Withdrawn: 'gray',
  Admitted: 'green',
  Waitlisted: 'amber',
  Pending: 'amber',
  Verified: 'green',
  Selected: 'green',
  Expired: 'gray',
  Scheduled: 'blue',
  Completed: 'green',
  'No-show': 'red',
  Rescheduled: 'amber',
};

export const Badge = ({ children, color }) => {
  const resolved = color || STATUS_COLOR_MAP[children] || 'gray';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${BADGE_STYLES[resolved]}`}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = 20 }) => (
  <div
    className="inline-block animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
    style={{ width: size, height: size }}
  />
);

export const LoadingBlock = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
    <Spinner /> {label}
  </div>
);

export const EmptyState = ({ label = 'No records found' }) => (
  <div className="flex items-center justify-center text-gray-400 py-10 text-sm">{label}</div>
);
