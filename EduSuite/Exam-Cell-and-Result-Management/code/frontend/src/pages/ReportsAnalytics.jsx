import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useClasses } from '../hooks/useExams.js';
import { usePassFailTrend, useSubjectPerformance } from '../hooks/useReports.js';

export default function ReportsAnalytics() {
  const [selectedClass, setSelectedClass] = useState('');
  const { data: classes } = useClasses();
  const { data: trend, isLoading: trendLoading } = usePassFailTrend(selectedClass || undefined);
  const { data: subjectPerf, isLoading: subjectLoading } = useSubjectPerformance(selectedClass || undefined);

  const overallPass = trend?.length ? (trend.reduce((sum, t) => sum + t.passPercentage, 0) / trend.length).toFixed(1) : '0.0';

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Institution-wide performance trends across exams"
        actions={
          <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">All Classes</option>
            {(classes || []).map((c) => (
              <option key={c._id} value={c._id}>{c.name} {c.section}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={BarChart3} label="Exams Analyzed" value={trend?.length ?? 0} />
        <StatCard icon={BarChart3} label="Avg Pass %" value={`${overallPass}%`} iconBg="bg-primary-50" iconColor="text-primary-600" />
        <StatCard icon={BarChart3} label="Subjects Tracked" value={subjectPerf?.length ?? 0} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">Pass / Fail Trend</h3>
            <p className="text-xs text-slate-400">Across recently processed exams</p>
          </div>
          <button className="btn-secondary text-xs py-2">
            <Download size={14} /> Export
          </button>
        </div>
        {trendLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : trend?.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9' }} />
              <Legend />
              <Line type="monotone" dataKey="passPercentage" name="Pass %" stroke="#3FA46A" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="failPercentage" name="Fail %" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-16">No processed results yet. Process results for an exam first.</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Subject-wise Pass Percentage</h3>
        <p className="text-xs text-slate-400 mb-4">Average across all processed exams per subject</p>
        {subjectLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : subjectPerf?.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={subjectPerf}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9' }} />
              <Bar dataKey="avgPassPercentage" name="Avg %" fill="#3FA46A" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-16">No subject performance data yet.</p>
        )}
      </Card>
    </div>
  );
}
