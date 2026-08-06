import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserPlus, 
  UserMinus, 
  Bed, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';

type ActivityType = 'allocation' | 'vacate' | 'attendance' | 'leave' | 'complaint';

interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  userId: string;
  metadata?: Record<string, any>;
}

export const RecentActivity: React.FC = () => {
  const { user } = useAuth();
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', user?.orgId],
    queryFn: async () => {
      const response = await apiClient.get<Activity[]>('/activity/recent', {
        params: { limit: 10 },
      });
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'allocation':
        return <UserPlus size={16} className="text-green-600" />;
      case 'vacate':
        return <UserMinus size={16} className="text-red-600" />;
      case 'attendance':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'leave':
        return <FileText size={16} className="text-yellow-600" />;
      case 'complaint':
        return <AlertCircle size={16} className="text-orange-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'allocation':
        return 'bg-green-50 border-green-200';
      case 'vacate':
        return 'bg-red-50 border-red-200';
      case 'attendance':
        return 'bg-blue-50 border-blue-200';
      case 'leave':
        return 'bg-yellow-50 border-yellow-200';
      case 'complaint':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Recent Activity</h3>
          <span className="text-sm text-gray-500">
            <Clock size={14} className="inline mr-1" />
            Live
          </span>
        </div>

        <div className="space-y-3">
          {activities?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities?.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};