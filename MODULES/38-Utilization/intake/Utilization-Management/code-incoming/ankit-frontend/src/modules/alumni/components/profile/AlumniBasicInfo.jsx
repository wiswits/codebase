/**
 * Alumni Basic Information Component
 * Displays personal details
 */

import React from 'react';
import { User, Calendar, Award, BookOpen } from 'lucide-react';
import { formatFullName } from '../../utils/alumniFormatters';

export default function AlumniBasicInfo({ profile, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const infoItems = [
    { label: 'Full Name', value: formatFullName(profile.firstName, profile.lastName), icon: <User className="h-4 w-4" /> },
    { label: 'Batch', value: profile.batch, icon: <Calendar className="h-4 w-4" /> },
    { label: 'Course', value: profile.course, icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Graduation Year', value: profile.graduationYear, icon: <Award className="h-4 w-4" /> }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
      <div className="space-y-3">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center space-x-2 text-gray-600">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}