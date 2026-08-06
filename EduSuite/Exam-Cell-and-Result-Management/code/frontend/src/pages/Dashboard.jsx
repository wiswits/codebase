import { CalendarClock, Users, FileCheck2, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { CardSkeleton, Skeleton } from '../components/ui/Skeleton.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useDashboardSummary } from '../hooks/useDashboard.js';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#3FA46A', '#f43f5e'];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboardSummary();

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`} />

      {isError && (
        <Card className="p-4 mb-6 bg-rose-50 border-rose-100 text-rose-600 text-sm">
          Could not load dashboard data. Make sure the backend API is running and seeded.
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={CalendarClock} label="Upcoming Exams" value={data?.stats.upcomingExams ?? 0} />
            <StatCard
              icon={Users}
              label="Students"
              value={data?.stats.totalStudents ?? 0}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              icon={FileCheck2}
              label="Published Results"
              value={data?.stats.publishedResults ?? 0}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Pass Percentage"
              value={`${data?.stats.passPercentage ?? 0}%`}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-1">Upcoming Exams</h3>
          <p className="text-xs text-slate-400 mb-4">Next scheduled examinations across classes</p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data?.upcomingExamList?.length ? (
                data.upcomingExamList.map((exam) => (
                  <div key={exam._id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{exam.name}</p>
                      <p className="text-xs text-slate-400">
                        {exam.class?.name} {exam.class?.section} &middot; {format(new Date(exam.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <Badge color="green">{exam.studentsAppearing} students</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">No upcoming exams scheduled</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-1">Pass / Fail</h3>
          <p className="text-xs text-slate-400 mb-2">Published results overview</p>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pass', value: data?.passFailDistribution.pass ?? 0 },
                      { name: 'Fail', value: data?.passFailDistribution.fail ?? 0 },
                    ]}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-slate-800">{data?.passFailDistribution.pass ?? 0}%</p>
                <p className="text-xs text-slate-400">Pass</p>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-500" /> Pass
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Fail
            </span>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Reports Overview</h3>
        <p className="text-xs text-slate-400 mb-4">Exams scheduled per month</p>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.reportsOverview || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9' }} />
              <Bar dataKey="exams" fill="#3FA46A" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
