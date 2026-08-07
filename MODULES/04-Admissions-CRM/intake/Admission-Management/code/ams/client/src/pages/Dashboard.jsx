import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { analyticsService } from '../services/domainServices';
import { enquiryService } from '../services/enquiryService';
import { StatCard, Card, LoadingBlock, Badge } from '../components/common/UI';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.dashboard(),
  });
  const { data: funnelData } = useQuery({ queryKey: ['dashboard-funnel'], queryFn: () => analyticsService.funnel({}) });
  const { data: roiData } = useQuery({ queryKey: ['dashboard-roi'], queryFn: () => analyticsService.sourceRoi() });
  const { data: recentEnquiries } = useQuery({
    queryKey: ['recent-enquiries'],
    queryFn: () => enquiryService.list({ limit: 5 }),
  });

  const s = stats?.data;
  const stages = funnelData?.data?.stages || [];
  const sourceRoi = roiData?.data?.sourceRoi || [];

  if (statsLoading) return <LoadingBlock label="Loading dashboard..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500">
          Admission Session {import.meta.env.VITE_CURRENT_FY || '2026-27'} &middot; Current date: {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Enquiries" value={s?.totalEnquiries ?? 0} accent="blue" />
        <StatCard label="Applications" value={s?.totalApplications ?? 0} accent="blue" />
        <StatCard label="Test Conducted" value={s?.testConducted ?? 0} accent="amber" />
        <StatCard label="Offers Sent" value={s?.offersSent ?? 0} accent="amber" />
        <StatCard label="Admissions" value={s?.admissions ?? 0} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Admission Funnel — This Session">
          {stages.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stages} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stages.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Applications by Source">
          {sourceRoi.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie data={sourceRoi} dataKey="applications" nameKey="source" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {sourceRoi.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {sourceRoi.map((row, i) => (
                  <div key={row.source} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 flex-1">{row.source}</span>
                    <span className="font-medium text-gray-800">{row.applications}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent Enquiries">
        {(recentEnquiries?.data?.enquiries || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No enquiries yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentEnquiries.data.enquiries.map((e) => (
              <div key={e._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-gray-700">{e.studentName}</p>
                  <p className="text-xs text-gray-400">{e.source} &middot; {new Date(e.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <Badge>{e.stage}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
