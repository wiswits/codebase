import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Bed, 
  Calendar, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { OccupancyWidget } from '../components/OccupancyWidget';
import { RecentActivity } from '../components/RecentActivity';
import { apiClient } from '../../../api/client';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../hooks/useAuth';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  color: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/occupancy/summary');
      return response.data;
    },
    refetchInterval: 300000,
  });

  const quickActions: QuickAction[] = [
    {
      label: 'Allocate Bed',
      icon: <Bed size={20} />,
      path: '/allocate',
      permission: 'hms:allocation:create',
      color: 'bg-apex-navy text-white',
    },
    {
      label: 'Take Attendance',
      icon: <Calendar size={20} />,
      path: '/attendance',
      permission: 'hms:attendance:create',
      color: 'bg-apex-gold text-white',
    },
    {
      label: 'View Reports',
      icon: <TrendingUp size={20} />,
      path: '/reports',
      permission: 'hms:report:read',
      color: 'bg-gray-700 text-white',
    },
    {
      label: 'Manage Complaints',
      icon: <AlertCircle size={20} />,
      path: '/complaints',
      permission: 'hms:complaint:read',
      color: 'bg-red-600 text-white',
    },
  ];

  const visibleActions = quickActions.filter(
    action => !action.permission || can(action.permission)
  );

  // Role-based welcome message
  const getWelcomeMessage = () => {
    if (user?.roles?.includes('warden')) {
      return 'Good to see you, Warden. Ready to take attendance?';
    }
    if (user?.roles?.includes('hostel_admin')) {
      return 'Welcome back, Hostel Admin. Here\'s your hostel overview.';
    }
    if (user?.roles?.includes('student')) {
      return `Welcome back, Student. Here's your hostel status.`;
    }
    if (user?.roles?.includes('parent')) {
      return 'Welcome, Parent. Stay updated on your child\'s hostel activities.';
    }
    return 'Welcome to Hostel Management System';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">Dashboard</h1>
          <p className="text-gray-600">{getWelcomeMessage()}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity size={14} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Total Students</p>
              <Users size={20} className="text-apex-navy opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats?.totalStudents || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Across {stats?.totalHostels || 0} hostels</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <Home size={20} className="text-apex-navy opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2 text-apex-navy">
              {stats?.occupancyRate || 0}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-apex-navy rounded-full h-2 transition-all duration-500"
                style={{ width: `${stats?.occupancyRate || 0}%` }}
              />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Available Beds</p>
              <Bed size={20} className="text-apex-gold opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2 text-apex-gold">
              {stats?.vacant || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.totalBeds || 0} total beds
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Pending Actions</p>
              <FileText size={20} className="text-apex-navy opacity-60" />
            </div>
            <p className="text-2xl font-bold mt-2">{stats?.pendingActions || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.pendingLeaves || 0} leave requests
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <div>
          <h2 className="font-display text-lg mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visibleActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all hover:scale-105 ${action.color}`}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyWidget />
        <RecentActivity />
      </div>

      {/* Quick Stats */}
      <Card>
        <div className="p-6">
          <h3 className="font-display text-lg mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Present Today</p>
              <p className="text-xl font-bold text-green-600">
                {stats?.presentToday || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent Today</p>
              <p className="text-xl font-bold text-red-600">
                {stats?.absentToday || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats?.onLeave || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Open Complaints</p>
              <p className="text-xl font-bold text-orange-600">
                {stats?.openComplaints || 0}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};