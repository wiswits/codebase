import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingBlock } from './UI';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingBlock label="Checking session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <p className="text-lg font-semibold text-gray-700">Access restricted</p>
        <p className="text-sm text-gray-500 mt-1">Your role ({user.role}) doesn't have permission to view this page.</p>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
