import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PermissionGuard = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallback = null 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const userRole = user?.role;

  const hasRole = requiredRoles.length === 0 || requiredRoles.includes(userRole);

  const permissions = {
    admin: ['*'],
    hr: ['view_employees', 'manage_attendance', 'manage_leave', 'view_reports', 'manage_announcements', 'manage_documents'],
    manager: ['view_team', 'manage_team_tasks', 'approve_leave', 'view_team_reports', 'schedule_meetings'],
    employee: ['view_self', 'manage_self_tasks', 'apply_leave', 'view_announcements', 'view_documents']
  };

  const userPermissions = permissions[userRole] || [];
  const hasPermission = requiredPermissions.length === 0 || 
    userPermissions.includes('*') || 
    requiredPermissions.some(p => userPermissions.includes(p));

  if (!hasRole || !hasPermission) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};