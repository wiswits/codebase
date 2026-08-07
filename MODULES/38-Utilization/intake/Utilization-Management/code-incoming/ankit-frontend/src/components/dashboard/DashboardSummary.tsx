/**
 * Dashboard Summary Component
 */

import React from 'react';
import { DashboardSummary as DashboardSummaryType } from '../../types/dashboard.types';
import { formatNumber, formatPercent } from '../../utils/formatter';
import {
  Users,
  UserCheck,
  Clock,
  Briefcase,
  TrendingUp,
  UserX,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface DashboardSummaryProps {
  summary: DashboardSummaryType;
  isLoading?: boolean;
}

const SummaryCardSkeleton = () => (
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

const SummaryCard = ({ title, value, icon, color, subtitle }: any) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
);

export default function DashboardSummary({ summary, isLoading = false }: DashboardSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: 'Total Employees',
      value: formatNumber(summary.totalEmployees),
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100',
    },
    {
      title: 'Active Employees',
      value: formatNumber(summary.activeEmployees),
      icon: <UserCheck className="w-5 h-5 text-green-600" />,
      color: 'bg-green-100',
    },
    {
      title: 'Utilization',
      value: formatPercent(summary.utilizationPercentage),
      icon: <TrendingUp className="w-5 h-5 text-gold-600" />,
      color: 'bg-yellow-100',
      subtitle: `Allocated: ${formatNumber(summary.allocatedCapacity)} hrs`,
    },
    {
      title: 'Bench Employees',
      value: formatNumber(summary.benchEmployees),
      icon: <UserX className="w-5 h-5 text-red-600" />,
      color: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <SummaryCard
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