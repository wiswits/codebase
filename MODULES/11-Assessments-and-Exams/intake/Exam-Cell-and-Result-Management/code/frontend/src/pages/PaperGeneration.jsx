import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileCog, Trash2, Eye, Sparkles, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useBlueprints } from '../hooks/useBlueprints.js';
import { usePapers, usePaper, useGeneratePaper, useDeletePaper, downloadPaperPdf } from '../hooks/usePapers.js';

const DIFFICULTY_COLOR = { easy: 'green', medium: 'amber', hard: 'red' };

export default function PaperGeneration() {
  const [previewId, setPreviewId] = useState(null);
  const { data: blueprints } = useBlueprints({});
  const { data: papers, isLoading } = usePapers({});
  const { data: previewPaper, isLoading: previewLoading } = usePaper(previewId);
  const generatePaper = useGeneratePaper();
  const deletePaper = useDeletePaper();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { blueprintId: '', numberOfSets: 2, duration: 180 },
  });

  const onGenerate = async (formData) => {
    await generatePaper.mutateAsync({
      ...formData,
      numberOfSets: Number(formData.numberOfSets),
      duration: Number(formData.duration),
    });
    reset({ blueprintId: formData.blueprintId, numberOfSets: 2, duration: 180 });
  };

  return (
    <div>
      <PageHeader title="Auto Paper Generation" subtitle="Generate exam paper sets automatically from a saved blueprint" />

      <Card className="p-5 mb-6">
        <form onSubmit={handleSubmit(onGenerate)} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Select Blueprint</label>
            <select className="input-field" {...register('blueprintId', { required: true })}>
              <option value="">Choose a saved blueprint</option>
              {(blueprints || []).map((bp) => (
                <option key={bp._id} value={bp._id}>
                  {bp.subject?.name} &middot; {bp.class?.name} {bp.class?.section} &middot; {bp.totalMarks} marks
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Number of Sets</label>
            <input type="number" min={1} max={6} className="input-field" {...register('numberOfSets')} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (min)</label>
            <input type="number" className="input-field" {...register('duration')} />
          </div>
          <div className="sm:col-span-4">
            <button type="submit" disabled={generatePaper.isPending} className="btn-primary w-full sm:w-auto">
              <Sparkles size={16} /> {generatePaper.isPending ? 'Generating...' : 'Generate Paper'}
            </button>
          </div>
        </form>
        {blueprints?.length === 0 && (
          <p className="text-xs text-amber-600 mt-3">
            No saved blueprints found. Create one in Blueprint Builder first.
          </p>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Generated Papers</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : papers?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <div key={paper._id} className="border border-slate-100 rounded-xl p-4 hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">Set {paper.setLabel}</p>
                    <p className="text-xs text-slate-400">{paper.blueprint?.subject?.name}</p>
                  </div>
                  <Badge color="green">{paper.totalMarks} marks</Badge>
                </div>
                <p className="text-xs text-slate-400 mb-3">{paper.sections.length} sections &middot; {paper.duration} min</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewId(paper._id)} className="btn-secondary flex-1 text-xs py-2">
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    onClick={() => downloadPaperPdf(paper._id, paper.setLabel)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition shrink-0"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => deletePaper.mutate(paper._id)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileCog size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No papers generated yet. Choose a blueprint above and generate one.</p>
          </div>
        )}
      </Card>

      <Modal open={!!previewId} onClose={() => setPreviewId(null)} title={`Paper Preview ${previewPaper ? '- Set ' + previewPaper.setLabel : ''}`} size="lg">
        {previewLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : previewPaper ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 pb-3 border-b border-slate-100">
              <span><strong className="text-slate-700">Subject:</strong> {previewPaper.blueprint?.subject?.name}</span>
              <span><strong className="text-slate-700">Total Marks:</strong> {previewPaper.totalMarks}</span>
              <span><strong className="text-slate-700">Duration:</strong> {previewPaper.duration} min</span>
            </div>
            {previewPaper.sections.map((section, sIdx) => (
              <div key={sIdx}>
                <h4 className="font-semibold text-slate-800 mb-2 text-sm">
                  Section {String.fromCharCode(65 + sIdx)}: {section.sectionName} <span className="text-slate-400 font-normal">({section.totalMarks} marks)</span>
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {section.questions.map((q) => (
                    <li key={q._id} className="text-sm text-slate-600">
                      {q.questionText}
                      <span className="ml-2 inline-flex gap-1">
                        <Badge color={DIFFICULTY_COLOR[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
                        <Badge color="slate">{q.marks}m</Badge>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <button onClick={() => downloadPaperPdf(previewPaper._id, previewPaper.setLabel)} className="btn-primary w-full">
              <Download size={15} /> Download as PDF
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
