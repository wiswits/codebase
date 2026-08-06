import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PermissionGuard } from './components/common/PermissionGuard';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import HRLayout from './layouts/HRLayout';
import ManagerLayout from './layouts/ManagerLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import LeavePage from './pages/LeavePage';
import MeetingsPage from './pages/MeetingsPage';
import CommunicationPage from './pages/CommunicationPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import DocumentsPage from './pages/DocumentsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import HRPage from './pages/HRPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPassword from './components/auth/ForgetPassword';  // ← Fixed: removed 't'
import ResetPassword from './components/auth/ResetPassword';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles.length > 0) {
    return (
      <PermissionGuard requiredRoles={requiredRoles}>
        {children}
      </PermissionGuard>
    );
  }

  return children;
};

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const getLayout = (role) => {
  switch (role) {
    case 'admin':
      return AdminLayout;
    case 'hr':
      return HRLayout;
    case 'manager':
      return ManagerLayout;
    default:
      return EmployeeLayout;
  }
};

const AppRoutes = () => {
  const { user } = useAuth();
  const Layout = user ? getLayout(user.role) : MainLayout;

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attendance/*" element={<AttendancePage />} />
        <Route path="tasks/*" element={<TasksPage />} />
        <Route path="leave/*" element={<LeavePage />} />
        <Route path="meetings/*" element={<MeetingsPage />} />
        <Route path="communication/*" element={<CommunicationPage />} />
        <Route path="announcements/*" element={<AnnouncementsPage />} />
        <Route path="documents/*" element={<DocumentsPage />} />
        <Route path="reports/*" element={<ReportsPage />} />
        <Route path="profile/*" element={<ProfilePage />} />
        <Route path="settings/*" element={<SettingsPage />} />

        {/* Admin Routes - Only Admin can access */}
        <Route path="admin/*" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        {/* HR Routes - Only Admin and HR can access */}
        <Route path="hr/*" element={
          <ProtectedRoute requiredRoles={['admin', 'hr']}>
            <RoleBasedRoute allowedRoles={['admin', 'hr']}>
              <HRPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />

        {/* Team Routes - Only Admin, HR, and Manager can access */}
        <Route path="team/*" element={
          <ProtectedRoute requiredRoles={['admin', 'hr', 'manager']}>
            <RoleBasedRoute allowedRoles={['admin', 'hr', 'manager']}>
              <TeamPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;