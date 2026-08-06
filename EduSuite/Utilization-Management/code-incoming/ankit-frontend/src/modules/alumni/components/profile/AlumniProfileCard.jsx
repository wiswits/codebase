/**
 * Alumni Profile Card Component
 * Main profile card with photo, name, and key details
 */

import React from 'react';
import { User, Calendar, BookOpen, Award } from 'lucide-react';
import { formatFullName, getStatusColor, getStatusLabel } from '../../utils/alumniFormatters';

export default function AlumniProfileCard({ profile, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center space-x-6">
          <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const fullName = formatFullName(profile.firstName, profile.lastName);
  const statusColor = getStatusColor(profile.status);
  const statusLabel = getStatusLabel(profile.status);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <User className="h-12 w-12 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white truncate">{fullName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center text-blue-100">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">Batch of {profile.batch}</span>
              </div>
              <div className="flex items-center text-blue-100">
                <BookOpen className="h-4 w-4 mr-1" />
                <span className="text-sm">{profile.course}</span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-4">
          {profile.achievements && (
            <div className="flex items-center text-sm text-gray-600">
              <Award className="h-4 w-4 text-yellow-500 mr-2" />
              <span>{profile.achievements}</span>
            </div>
          )}
          {profile.currentEmployment && (
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
              <span>{profile.currentEmployment}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}