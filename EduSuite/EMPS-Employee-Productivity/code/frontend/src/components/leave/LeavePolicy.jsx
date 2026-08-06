import React from 'react';
import { FaFileAlt, FaCheckCircle, FaClock, FaCalendarAlt } from 'react-icons/fa';

const LeavePolicy = () => {
  const policies = [
    {
      title: 'Casual Leave',
      description: '12 days per year. Can be taken for personal reasons or family events.',
      icon: FaCalendarAlt,
      color: 'text-blue-500'
    },
    {
      title: 'Sick Leave',
      description: '10 days per year. Requires medical certificate for more than 2 days.',
      icon: FaFileAlt,
      color: 'text-green-500'
    },
    {
      title: 'Emergency Leave',
      description: '5 days per year. For urgent family or personal emergencies.',
      icon: FaClock,
      color: 'text-red-500'
    },
    {
      title: 'Paid Leave',
      description: '20 days per year. Earned leave that can be accumulated.',
      icon: FaCheckCircle,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Leave Policy
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <policy.icon className={`${policy.color} text-xl`} />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {policy.title}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {policy.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
          Important Notes:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Leave requests must be submitted at least 2 days in advance</li>
          <li>• Unused casual and sick leave does not carry forward to next year</li>
          <li>• Paid leave can be accumulated up to 60 days</li>
          <li>• Leave approval follows the workflow: Employee → Manager → HR</li>
        </ul>
      </div>
    </div>
  );
};

export default LeavePolicy;