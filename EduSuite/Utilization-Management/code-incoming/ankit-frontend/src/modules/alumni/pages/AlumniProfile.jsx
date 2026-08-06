/**
 * Alumni Profile Page
 * Displays detailed information for a single alumni
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAlumniProfile } from '../hooks/useAlumniProfile';
import AlumniProfileCard from '../components/profile/AlumniProfileCard';
import AlumniBasicInfo from '../components/profile/AlumniBasicInfo';
import AlumniAcademicInfo from '../components/profile/AlumniAcademicInfo';
import AlumniContactInfo from '../components/profile/AlumniContactInfo';
import { ArrowLeft, Loader2, AlertCircle, User } from 'lucide-react';

export default function AlumniProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { loading, error, profile, fetchProfile, clearProfile, clearError } = useAlumniProfile();

  useEffect(() => {
    if (id) {
      const alumniId = parseInt(id);
      if (!isNaN(alumniId)) {
        fetchProfile(alumniId);
      }
    }
    return () => {
      clearProfile();
    };
  }, [id]);

  const handleRetry = () => {
    clearError();
    if (id) {
      fetchProfile(parseInt(id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading alumni profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Profile</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/alumni/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Alumni Not Found</h3>
          <p className="text-gray-600 mb-4">The alumni profile you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/alumni/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Alumni Profile</h1>
        </div>

        {/* Profile Content */}
        <div className="space-y-6">
          {/* Profile Card */}
          <AlumniProfileCard profile={profile} />

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AlumniBasicInfo profile={profile} />
            <AlumniAcademicInfo profile={profile} />
          </div>

          {/* Contact Info */}
          <AlumniContactInfo profile={profile} />
        </div>
      </div>
    </div>
  );
}