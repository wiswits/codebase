import { useState } from 'react';
import { CheckCircle2, FileEdit, Eye, ShieldCheck, Send } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useExamsWithResults, useResultsByExam, useUpdateResultStatus } from '../hooks/useResults.js';

const STEPS = [
  { key: 'draft', label: 'Draft', icon: FileEdit },
  { key: 'reviewed', label: 'Review', icon: Eye },
  { key: 'approved', label: 'Approve', icon: ShieldCheck },
  { key: 'published', label: 'Publish', icon: Send },
];

export default function ResultPublishing() {
  const [selectedExam, setSelectedExam] = useState('');
  const { data: exams } = useExamsWithResults();
  const { data: results, isLoading } = useResultsByExam(selectedExam || undefined);
  const updateStatus = useUpdateResultStatus();

  const currentStatus = results?.[0]?.status || 'draft';
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStatus);

  const nextStep = STEPS[currentStepIndex + 1];

  return (
    <div>
      <PageHeader
        title="Result Publishing"
        subtitle="Move processed results through review, approval, and publication"
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

      {!selectedExam ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <Send size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">
            Select an exam with processed results above. Only exams that have been through Result Processing appear here.
          </p>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="p-6 sm:p-8">
          <h3 className="font-semibold text-slate-800 mb-1">
            {exams?.find((e) => e._id === selectedExam)?.name}
          </h3>
          <p className="text-sm text-slate-400 mb-8">{results?.length || 0} student results in this batch</p>

          <div className="flex items-center justify-between max-w-2xl mx-auto mb-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= currentStepIndex;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition ${
                        done ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className={`text-xs font-medium ${done ? 'text-primary-700' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-primary-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="max-w-md mx-auto text-center">
            <p className="text-sm text-slate-500 mb-4">
              Current status: <span className="font-semibold text-slate-700 capitalize">{currentStatus}</span>
            </p>
            {nextStep ? (
              <button
                onClick={() => updateStatus.mutate({ examId: selectedExam, status: nextStep.key })}
                disabled={updateStatus.isPending}
                className="btn-primary w-full py-3"
              >
                {updateStatus.isPending ? 'Updating...' : `Move to ${nextStep.label}`}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary-700 font-medium bg-primary-50 rounded-xl py-3">
                <CheckCircle2 size={18} /> Results published to students
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
