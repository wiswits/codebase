import { format } from 'date-fns';
import { GraduationCap, Download, TrendingUp, Award } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyResults, downloadMarksheetPdf } from '../hooks/useResults.js';
import { useSettings } from '../hooks/useSettings.js';

export default function StudentResultPortal() {
  const { user } = useAuth();
  const { data: results, isLoading } = useMyResults();
  const { data: settings } = useSettings();

  const showRank = settings?.showRank ?? true;
  const presentResults = (results || []).filter((r) => !r.isAbsent);
  const avgPercentage = presentResults.length
    ? (presentResults.reduce((sum, r) => sum + r.percentage, 0) / presentResults.length).toFixed(1)
    : '0.0';
  const ranks = presentResults.map((r) => r.rank).filter((r) => r != null);
  const bestRank = ranks.length ? Math.min(...ranks) : null;

  const statCols = showRank ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <div>
      <PageHeader title="My Results" subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}`} />

      <div className={`grid grid-cols-1 ${statCols} gap-4 mb-6`}>
        {isLoading ? (
          Array.from({ length: showRank ? 3 : 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={GraduationCap} label="Published Results" value={results?.length ?? 0} />
            <StatCard icon={TrendingUp} label="Average %" value={`${avgPercentage}%`} iconBg="bg-primary-50" iconColor="text-primary-600" />
            {showRank && (
              <StatCard icon={Award} label="Best Rank" value={bestRank ? `#${bestRank}` : '-'} iconBg="bg-amber-50" iconColor="text-amber-600" />
            )}
          </>
        )}
      </div>

      <Card className="p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Result History</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : results?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((r) => (
              <div key={r._id} className="border border-slate-100 rounded-xl p-4 hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{r.exam?.name}</p>
                    <p className="text-xs text-slate-400">
                      {r.exam?.subject?.name} &middot; {r.exam?.date ? format(new Date(r.exam.date), 'dd MMM yyyy') : ''}
                    </p>
                  </div>
                  <Badge color={r.isAbsent ? 'slate' : r.result === 'pass' ? 'green' : 'red'}>{r.grade}</Badge>
                </div>
                {r.isAbsent ? (
                  <div className="bg-slate-50 rounded-lg py-3 my-3 text-center text-sm text-slate-400">Marked absent for this exam</div>
                ) : (
                  <div className={`grid ${showRank ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center my-3`}>
                    <div className="bg-slate-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-slate-700">{r.marksObtained}/{r.totalMarks}</p>
                      <p className="text-[10px] text-slate-400">Marks</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-slate-700">{r.percentage}%</p>
                      <p className="text-[10px] text-slate-400">Percentage</p>
                    </div>
                    {showRank && (
                      <div className="bg-slate-50 rounded-lg py-2">
                        <p className="text-sm font-bold text-slate-700">{r.rank ? `#${r.rank}` : '—'}</p>
                        <p className="text-[10px] text-slate-400">Rank</p>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => downloadMarksheetPdf(r._id, user?.rollNo)} className="btn-secondary w-full text-xs py-2">
                  <Download size={13} /> Download Marksheet
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <GraduationCap size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No published results yet. Check back once your exams have been graded.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
