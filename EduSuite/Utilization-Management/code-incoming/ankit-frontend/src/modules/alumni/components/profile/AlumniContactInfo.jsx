/**
 * Alumni Contact Information Component
 * Displays contact details
 */

import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

export default function AlumniContactInfo({ profile, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
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

  const contactItems = [
    { label: 'Email', value: profile.email, icon: <Mail className="h-4 w-4" /> },
    { label: 'Phone', value: profile.phone, icon: <Phone className="h-4 w-4" /> },
    { label: 'Location', value: profile.location || 'Not specified', icon: <MapPin className="h-4 w-4" /> },
    ...(profile.linkedin ? [{ label: 'LinkedIn', value: profile.linkedin, icon: <Linkedin className="h-4 w-4" /> }] : []),
    ...(profile.website ? [{ label: 'Website', value: profile.website, icon: <Globe className="h-4 w-4" /> }] : [])
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
      <div className="space-y-3">
        {contactItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center space-x-2 text-gray-600">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {item.label === 'Email' || item.label === 'LinkedIn' || item.label === 'Website' ? (
                <a href={item.label === 'Email' ? `mailto:${item.value}` : item.value} className="text-blue-600 hover:underline">
                  {item.value}
                </a>
              ) : (
                item.value || '-'
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}