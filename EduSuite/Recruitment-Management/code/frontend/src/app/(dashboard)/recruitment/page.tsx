'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { DataStates } from '@/components/shared/DataStates';
import { dashboardService } from '@/services/dashboard.service';
import {
  Briefcase,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function RecruitmentDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const stats = data;

  const statCards = [
    {
      title: 'Total Vacancies',
      value: stats?.vacancies?.total || 0,
      icon: Briefcase,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Open Vacancies',
      value: stats?.vacancies?.open || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Applicants',
      value: stats?.applicants?.total || 0,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Interviews Scheduled',
      value: stats?.interviews?.scheduled || 0,
      icon: Calendar,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      title: 'Offers Sent',
      value: stats?.offers?.sent || 0,
      icon: FileText,
      color: 'text-gold',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Offers Accepted',
      value: stats?.offers?.accepted || 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Recruitment Dashboard</h1>
        <p className="text-gray-500">Overview of your recruitment activities</p>
      </div>

      <DataStates
        isLoading={isLoading}
        error={error}
        isEmpty={!stats}
        emptyMessage="No data available"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold text-navy mt-1">{card.value}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${card.bg}`}>
                      <Icon size={18} className={card.color} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stage Distribution */}
        {stats?.applicants?.byStage && (
          <Card>
            <CardHeader>
              <CardTitle>Applicant Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
                {Object.entries(stats.applicants.byStage).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <p className="text-lg font-bold text-navy">{count as number}</p>
                    <p className="text-xs text-gray-500 truncate">{stage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview Stats */}
        {stats?.interviews && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Scheduled</span>
                    <span className="font-medium">{stats.interviews.scheduled || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completed</span>
                    <span className="font-medium">{stats.interviews.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Cancelled</span>
                    <span className="font-medium">{stats.interviews.cancelled || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">No Show</span>
                    <span className="font-medium">{stats.interviews.noShow || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Offer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sent</span>
                    <span className="font-medium">{stats.offers?.sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Accepted</span>
                    <span className="font-medium text-green-600">{stats.offers?.accepted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Rejected</span>
                    <span className="font-medium text-red-600">{stats.offers?.rejected || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pending</span>
                    <span className="font-medium">{stats.offers?.pending || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DataStates>
    </div>
  );
}