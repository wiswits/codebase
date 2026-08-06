/**
 * Payroll Statistics Cards
 */

import React from 'react';
import {
  Users,
  Calendar,
  IndianRupee,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../../utils/payrollFormatters';

const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
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

export default function StatsCards({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
        <p>No payroll data available</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100',
      subtitle: `Period: ${stats.currentPeriod}`
    },
    {
      title: 'Gross Payroll',
      value: formatCurrency(stats.grossTotal),
      icon: <IndianRupee className="w-5 h-5 text-green-600" />,
      color: 'bg-green-100',
      subtitle: `Status: ${stats.runStatus}`
    },
    {
      title: 'Total Deductions',
      value: formatCurrency(stats.deductionsTotal),
      icon: <TrendingDown className="w-5 h-5 text-red-600" />,
      color: 'bg-red-100'
    },
    {
      title: 'Payslips Generated',
      value: stats.payslipsGenerated,
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-100'
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