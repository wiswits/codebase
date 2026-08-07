import { useState } from 'react';
import { BookOpenCheck, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Pagination } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSubjects } from '../hooks/useExams.js';
import { useQuestions } from '../hooks/useQuestions.js';

const DIFFICULTY_COLOR = { easy: 'green', medium: 'amber', hard: 'red' };

export default function StudentPractice() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [expanded, setExpanded] = useState(null);

  const { data: subjects } = useSubjects(user?.classAssigned);
  const { data, isLoading } = useQuestions({ page, limit: 10, search, subject });

  return (
    <div>
      <PageHeader title="Practice Questions" subtitle="Browse questions from your subjects to prepare for exams" />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-10"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field sm:w-56"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Subjects</option>
            {(subjects || []).map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : data?.data?.length ? (
          <>
            <div className="space-y-2">
              {data.data.map((q) => {
                const isOpen = expanded === q._id;
                return (
                  <div key={q._id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : q._id)}
                      className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700">{q.questionText}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge color="slate">{q.subject?.name}</Badge>
                          <Badge color="slate" className="capitalize">{q.chapter}</Badge>
                          <Badge color={DIFFICULTY_COLOR[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
                          <span className="text-xs text-slate-400">{q.marks} marks</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </button>
                    {isOpen && q.questionType === 'mcq' && q.options?.length > 0 && (
                      <div className="px-4 pb-4 pt-1 space-y-1.5 bg-slate-50/50">
                        {q.options.map((opt, i) => (
                          <div key={i} className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                              {String.fromCharCode(97 + i)}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    {isOpen && q.questionType !== 'mcq' && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/50">
                        <p className="text-xs text-slate-400">
                          This is a {q.questionType.replace('_', ' ')} question worth {q.marks} marks — write out your answer on paper to practice.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpenCheck size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No practice questions available yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
