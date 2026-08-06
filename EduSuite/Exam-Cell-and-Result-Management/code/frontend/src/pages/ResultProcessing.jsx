import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calculator, Sparkles, Download, UserX } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList } from '../hooks/useSeating.js';
import { useResultsByExam, useResultSummary, useProcessResults, downloadMarksheetPdf } from '../hooks/useResults.js';
import { useSettings } from '../hooks/useSettings.js';

const GRADE_COLORS = ['#3FA46A', '#5cb187', '#f59e0b', '#f97316', '#ef4444', '#94a3b8', '#64748b'];

export default function ResultProcessing() {
  const [selectedExam, setSelectedExam] = useState('');

  const { data: exams } = useExamsList();
  const { data: results, isLoading: resultsLoading } = useResultsByExam(selectedExam || undefined);
  const { data: summary, isLoading: summaryLoading } = useResultSummary(selectedExam || undefined);
  const { data: settings } = useSettings();
  const processResults = useProcessResults();

  const showRank = settings?.showRank ?? true;
  const columns = showRank
    ? ['Rank', 'Roll No', 'Student', 'Marks', 'Grade', '']
    : ['Roll No', 'Student', 'Marks', 'Grade', ''];

  return (
    <div>
      <PageHeader
        title="Result Processing"
        subtitle="Compute grades, ranks and pass/fail outcomes from entered marks"
        actions={
          <div className="flex items-center gap-2">
            <select className="input-field" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
              <option value="">Select exam</option>
              {(exams || []).map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name} &middot; {exam.class?.name} {exam.class?.section}
                </option>
              ))}
            </select>
            <button
              onClick={() => processResults.mutate(selectedExam)}
              disabled={!selectedExam || processResults.isPending}
              className="btn-primary"
            >
              <Sparkles size={16} /> {processResults.isPending ? 'Processing...' : 'Process Results'}
            </button>
          </div>
        }
      />

      {!selectedExam ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <Calculator size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Select an exam above, then click Process Results to compute outcomes.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {summaryLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            ) : (
              <>
                <StatCard icon={Calculator} label="Total Students" value={summary?.totalStudents ?? 0} />
                <StatCard icon={Calculator} label="Passed" value={summary?.passed ?? 0} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                <StatCard icon={Calculator} label="Failed" value={summary?.failed ?? 0} iconBg="bg-rose-50" iconColor="text-rose-600" />
                <StatCard icon={UserX} label="Absent" value={summary?.absent ?? 0} iconBg="bg-slate-100" iconColor="text-slate-500" />
                <StatCard icon={Calculator} label="Pass %" value={`${summary?.passPercentage ?? 0}%`} iconBg="bg-primary-50" iconColor="text-primary-600" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold text-slate-800 mb-4">Result List</h3>
              {resultsLoading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : results?.length ? (
                <Table columns={columns}>
                  {results.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition">
                      {showRank && <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{r.rank ? `#${r.rank}` : '—'}</td>}
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{r.student?.rollNo}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{r.student?.name}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                        {r.isAbsent ? 'AB' : `${r.marksObtained} / ${r.totalMarks} (${r.percentage}%)`}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Badge color={r.isAbsent ? 'slate' : r.result === 'pass' ? 'green' : 'red'}>{r.grade}</Badge>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => downloadMarksheetPdf(r._id, r.student?.rollNo)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition"
                          title="Download marksheet PDF"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">No results processed yet for this exam.</p>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-1">Grade Distribution</h3>
              <p className="text-xs text-slate-400 mb-2">Across all processed results</p>
              {summaryLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : summary?.gradeDistribution?.length ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={summary.gradeDistribution} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="count" nameKey="grade">
                        {summary.gradeDistribution.map((_, i) => (
                          <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {summary.gradeDistribution.map((g, i) => (
                      <span key={g.grade} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: GRADE_COLORS[i % GRADE_COLORS.length] }} />
                        {g.grade}: {g.percentage}%
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">No data yet</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
