import { useState, useRef } from 'react';
import { ScanLine, UploadCloud, Play, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList } from '../hooks/useSeating.js';
import { useOMRSheets, useUploadOMR, useEvaluateOMR, useDeleteOMR } from '../hooks/useOmr.js';

const STATUS_COLOR = { pending: 'amber', processing: 'slate', completed: 'green', error: 'red' };

export default function OMREvaluation() {
  const [selectedExam, setSelectedExam] = useState('');
  const fileInputRef = useRef(null);

  const { data: exams } = useExamsList();
  const { data: sheets, isLoading } = useOMRSheets(selectedExam ? { exam: selectedExam } : {});
  const uploadOMR = useUploadOMR();
  const evaluateOMR = useEvaluateOMR();
  const deleteOMR = useDeleteOMR();

  const total = sheets?.length || 0;
  const evaluated = sheets?.filter((s) => s.status === 'completed').length || 0;
  const pending = total - evaluated;
  const avgAccuracy = evaluated
    ? (sheets.filter((s) => s.status === 'completed').reduce((sum, s) => sum + (s.accuracy || 0), 0) / evaluated).toFixed(2)
    : '0.00';

  const handleFileChange = async (e) => {
    if (!selectedExam) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadOMR.mutateAsync({ examId: selectedExam, files });
    e.target.value = '';
  };

  return (
    <div>
      <PageHeader
        title="OMR Evaluation"
        subtitle="Upload and auto-score OMR answer sheets"
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ScanLine} label="Total Sheets" value={total} />
        <StatCard icon={Play} label="Evaluated" value={evaluated} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={UploadCloud} label="Pending" value={pending} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard icon={ScanLine} label="Avg Accuracy" value={`${avgAccuracy}%`} iconBg="bg-primary-50" iconColor="text-primary-600" />
      </div>

      <Card className="p-5 mb-6">
        <div
          onClick={() => selectedExam && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            selectedExam ? 'border-primary-200 hover:bg-primary-50/40 cursor-pointer' : 'border-slate-200 opacity-50 cursor-not-allowed'
          }`}
        >
          <UploadCloud size={28} className="mx-auto text-primary-400 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            {uploadOMR.isPending ? 'Uploading...' : 'Click to upload OMR sheets'}
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG or PDF &middot; up to 20 files at once</p>
          <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
        </div>
        {!selectedExam && <p className="text-xs text-amber-600 mt-3">Select an exam above to enable uploads.</p>}
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Uploaded Sheets</h3>
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : sheets?.length ? (
          <Table columns={['File Name', 'Exam', 'Uploaded By', 'Status', 'Accuracy', '']}>
            {sheets.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-3 whitespace-nowrap text-slate-700 max-w-[180px] truncate">{s.fileName}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{s.exam?.name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{s.uploadedBy?.name}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Badge color={STATUS_COLOR[s.status]} className="capitalize">{s.status}</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{s.accuracy ? `${s.accuracy}%` : '-'}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 justify-end">
                    {s.status === 'pending' && (
                      <button
                        onClick={() => evaluateOMR.mutate(s._id)}
                        disabled={evaluateOMR.isPending}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <Play size={12} /> Evaluate
                      </button>
                    )}
                    <button
                      onClick={() => deleteOMR.mutate(s._id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="text-center py-16">
            <ScanLine size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No OMR sheets uploaded yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
