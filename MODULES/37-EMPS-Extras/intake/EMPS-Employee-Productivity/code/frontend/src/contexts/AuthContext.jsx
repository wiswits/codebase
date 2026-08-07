import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  const initAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user'); // ← ADD THIS LINE
      
      if (token && userData) {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
        setPermissions(getUserPermissions(user));
      } else if (token) {
        // If token exists but no user, validate token
        const response = await authApi.validateToken();
        if (response.success) {
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          setIsAuthenticated(true);
          setPermissions(getUserPermissions(user));
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  initAuth();
}, []);

  const getUserPermissions = (user) => {
    const permissionsMap = {
      admin: ['*'],
      hr: ['view_employees', 'manage_attendance', 'manage_leave', 'view_reports', 'manage_announcements', 'manage_documents'],
      manager: ['view_team', 'manage_team_tasks', 'approve_leave', 'view_team_reports', 'schedule_meetings'],
      employee: ['view_self', 'manage_self_tasks', 'apply_leave', 'view_announcements', 'view_documents']
    };
    return permissionsMap[user?.role] || [];
  };

const login = async (employeeId, password, rememberMe) => {
  try {
    const response = await authApi.login({ employeeId, password, rememberMe });
    
    if (response.success) {
      const { user, token } = response.data;
      
      // Save both token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // ← ADD THIS LINE
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      setUser(user);
      setIsAuthenticated(true);
      setPermissions(getUserPermissions(user));
      return { success: true, user };
    }
    
    return { success: false, message: response.message };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed' 
    };
  }
};

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('rememberMe');
      setUser(null);
      setIsAuthenticated(false);
      setPermissions([]);
      navigate('/login');
    }
  };

  const hasPermission = (permission) => {
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

  const value = {
    user,
    isAuthenticated,
    loading,
    permissions,
    login,
    logout,
    hasPermission,
    hasRole,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};