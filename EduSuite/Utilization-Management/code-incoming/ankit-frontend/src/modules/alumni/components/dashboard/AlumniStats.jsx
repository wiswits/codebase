/**
 * Alumni Statistics Cards Component
 * Displays 4 stat cards with icons
 */

import React from 'react';
import { Users, UserCheck, GraduationCap, TrendingUp } from 'lucide-react';

const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function AlumniStats({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Alumni',
      value: stats?.totalAlumni || 0,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Active Alumni',
      value: stats?.activeAlumni || 0,
      icon: <UserCheck className="w-5 h-5 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Recent Graduates',
      value: stats?.recentGraduates || 0,
      icon: <GraduationCap className="w-5 h-5 text-gold-600" />,
      color: 'bg-yellow-100',
      subtitle: 'Class of 2024'
    },
    {
      title: 'Top Batch',
      value: stats?.topBatches?.[0]?.batch || '-',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-100',
      subtitle: `${stats?.topBatches?.[0]?.count || 0} alumni`
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  );
}