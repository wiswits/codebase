import { useState, useEffect } from 'react';
import { Edit3, Save } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList } from '../hooks/useSeating.js';
import { useMarksSheet, useSaveMarks } from '../hooks/useMarks.js';

export default function ResultEntry() {
  const [selectedExam, setSelectedExam] = useState('');
  const [entries, setEntries] = useState({});

  const { data: exams } = useExamsList();
  const { data: sheet, isLoading } = useMarksSheet(selectedExam || undefined);
  const saveMarks = useSaveMarks();

  useEffect(() => {
    if (!sheet) return;
    const initial = {};
    sheet.rows.forEach((row) => {
      initial[row.student._id] = {
        marksObtained: row.mark?.marksObtained ?? '',
        remarks: row.mark?.remarks ?? '',
        isAbsent: row.mark?.isAbsent ?? false,
      };
    });
    setEntries(initial);
  }, [sheet]);

  const updateEntry = (studentId, field, value) => {
    setEntries((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSave = async () => {
    const payload = {
      examId: selectedExam,
      subjectId: sheet.exam.subject._id,
      entries: Object.entries(entries).map(([studentId, val]) => ({ studentId, ...val })),
    };
    await saveMarks.mutateAsync(payload);
  };

  return (
    <div>
      <PageHeader
        title="Result Entry"
        subtitle="Enter or update student marks for an exam"
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
            <Edit3 size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Select an exam above to load its marks entry grid.</p>
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : sheet ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">{sheet.exam.name}</h3>
                <p className="text-xs text-slate-400">
                  {sheet.exam.subject?.name} &middot; Max Marks: {sheet.exam.totalMarks}
                </p>
              </div>
              <button onClick={handleSave} disabled={saveMarks.isPending} className="btn-primary">
                <Save size={16} /> {saveMarks.isPending ? 'Saving...' : 'Save Marks'}
              </button>
            </div>

            <Table columns={['Roll No', 'Student Name', 'Absent', 'Marks Obtained', 'Remarks']}>
              {sheet.rows.map((row) => {
                const entry = entries[row.student._id] || {};
                return (
                  <tr key={row.student._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{row.student.rollNo}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{row.student.name}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-primary-500"
                        checked={!!entry.isAbsent}
                        onChange={(e) => updateEntry(row.student._id, 'isAbsent', e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={0}
                        max={sheet.exam.totalMarks}
                        disabled={entry.isAbsent}
                        className="input-field w-24 py-1.5 disabled:bg-slate-50 disabled:text-slate-300"
                        placeholder={entry.isAbsent ? 'AB' : ''}
                        value={entry.marksObtained ?? ''}
                        onChange={(e) => updateEntry(row.student._id, 'marksObtained', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        className="input-field py-1.5"
                        placeholder="Optional remarks"
                        value={entry.remarks ?? ''}
                        onChange={(e) => updateEntry(row.student._id, 'remarks', e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </Table>
          </>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </Card>
    </div>
  );
}
