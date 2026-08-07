/**
 * Payroll Quick Actions
 */

import React from 'react';
import { useRouter } from 'next/router';
import {
  PlusCircle,
  FileText,
  Users,
  Download,
  Calendar,
  IndianRupee
} from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'New Payroll Run',
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: () => router.push('/hr/payroll/runs/create'),
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      label: 'Salary Structures',
      icon: <IndianRupee className="h-5 w-5" />,
      onClick: () => router.push('/hr/payroll/structures'),
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'View Payslips',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => router.push('/hr/payroll/payslips'),
      color: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      label: 'Manage Deductions',
      icon: <Users className="h-5 w-5" />,
      onClick: () => router.push('/hr/payroll/deductions'),
      color: 'bg-orange-600 hover:bg-orange-700 text-white'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${action.color}`}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}