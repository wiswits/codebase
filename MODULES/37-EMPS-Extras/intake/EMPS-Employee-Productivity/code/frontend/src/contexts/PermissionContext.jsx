import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user, permissions } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const can = (action, resource) => {
    const permissionMap = {
      create: ['admin', 'hr', 'manager'],
      read: ['admin', 'hr', 'manager', 'employee'],
      update: ['admin', 'hr', 'manager'],
      delete: ['admin'],
      approve: ['admin', 'hr', 'manager'],
      view: ['admin', 'hr', 'manager', 'employee']
    };

    const allowedRoles = permissionMap[action] || [];
    return hasRole(allowedRoles);
  };

  const value = useMemo(() => ({
    hasPermission,
    hasRole,
    can,
    user,
    permissions
  }), [user, permissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};