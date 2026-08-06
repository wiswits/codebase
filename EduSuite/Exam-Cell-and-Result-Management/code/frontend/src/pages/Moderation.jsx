import { useState } from 'react';
import { GitPullRequestArrow, Pencil } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList } from '../hooks/useSeating.js';
import { useModerationQueue, useModerateMark } from '../hooks/useMarks.js';

export default function Moderation() {
  const [selectedExam, setSelectedExam] = useState('');
  const [activeMark, setActiveMark] = useState(null);
  const [moderatedMarks, setModeratedMarks] = useState('');
  const [reason, setReason] = useState('');

  const { data: exams } = useExamsList();
  const { data: marks, isLoading } = useModerationQueue(selectedExam || undefined);
  const moderateMark = useModerateMark();

  const openModal = (mark) => {
    setActiveMark(mark);
    setModeratedMarks(mark.moderated ? String(mark.moderatedMarks) : String(mark.marksObtained));
    setReason('');
  };

  const reasonValid = reason.trim().length >= 10;

  const handleApply = async () => {
    if (!activeMark || !reasonValid) return;
    await moderateMark.mutateAsync({ id: activeMark._id, moderatedMarks, reason: reason.trim() });
    setActiveMark(null);
  };

  return (
    <div>
      <PageHeader
        title="Moderation"
        subtitle="Review and adjust marks before final result processing"
        actions={
          <select className="input-field" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Select exam</option>
            {(exams || []).map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.name} &middot; {exam.class?.name} {exam.class?.section}
              </option>
            ))}
          </select>
        }
      />

      <Card className="p-4 sm:p-5">
        {!selectedExam ? (
          <div className="text-center py-16">
            <GitPullRequestArrow size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Select an exam above to review its marks for moderation.</p>
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : marks?.length ? (
          <Table columns={['Roll No', 'Student', 'Original Marks', 'Moderated Marks', 'Status', '']}>
            {marks.map((m) => (
              <tr key={m._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{m.student?.rollNo}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{m.student?.name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                  {m.isAbsent ? 'AB' : `${m.marksObtained} / ${m.maxMarks}`}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                  {m.moderated ? `${m.moderatedMarks} / ${m.maxMarks}` : '—'}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {m.moderated ? <Badge color="green">Moderated</Badge> : <Badge color="amber">Pending</Badge>}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <button
                    onClick={() => openModal(m)}
                    disabled={m.isAbsent}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    <Pencil size={13} /> Moderate
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="text-center py-16">
            <GitPullRequestArrow size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No marks entered for this exam yet. Enter marks in Result Entry first.</p>
          </div>
        )}
      </Card>

      <Modal open={!!activeMark} onClose={() => setActiveMark(null)} title="Moderate Mark">
        {activeMark && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <p className="font-medium text-slate-700">{activeMark.student?.name}</p>
              <p className="text-xs text-slate-400">
                Roll {activeMark.student?.rollNo} &middot; Original: {activeMark.marksObtained} / {activeMark.maxMarks}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Moderated Marks</label>
              <input
                type="number"
                min={0}
                max={activeMark.maxMarks}
                className="input-field w-32"
                value={moderatedMarks}
                onChange={(e) => setModeratedMarks(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Reason for change <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="e.g. Grace marks applied — paper was harder than the blueprint intended (min 10 characters)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {!reasonValid && reason.length > 0 && (
                <p className="text-xs text-rose-500 mt-1">Reason must be at least 10 characters — this gets recorded in the audit trail.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveMark(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleApply} disabled={!reasonValid || moderateMark.isPending} className="btn-primary">
                {moderateMark.isPending ? 'Applying...' : 'Apply Moderation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
