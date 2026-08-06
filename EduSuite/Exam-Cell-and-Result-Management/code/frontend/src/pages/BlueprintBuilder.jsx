import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle2, Save, FileStack } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useClasses, useSubjects } from '../hooks/useExams.js';
import { useBlueprints, useCreateBlueprint, useUpdateBlueprint, useDeleteBlueprint } from '../hooks/useBlueprints.js';

const emptyChapter = () => ({
  chapter: '',
  weightagePercent: 10,
  totalMarks: 10,
  bloomLevels: { remember: 20, understand: 20, apply: 20, analyze: 20, evaluate: 10, create: 10 },
  difficulty: { easy: 34, medium: 33, hard: 33 },
});

export default function BlueprintBuilder() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');

  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: blueprints, isLoading } = useBlueprints(filterSubject ? { subject: filterSubject } : {});
  const createBlueprint = useCreateBlueprint();
  const updateBlueprint = useUpdateBlueprint();
  const deleteBlueprint = useDeleteBlueprint();

  const { register, control, handleSubmit, watch, reset } = useForm({
    defaultValues: { subject: '', class: '', totalMarks: 100, chapters: [emptyChapter()] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'chapters' });
  const watchedChapters = watch('chapters');

  const totalWeightage = useMemo(
    () => fields.reduce((sum, _, idx) => sum + (Number(watchedChapters?.[idx]?.weightagePercent) || 0), 0),
    [fields, watchedChapters]
  );
  const totalChapterMarks = useMemo(
    () => fields.reduce((sum, _, idx) => sum + (Number(watchedChapters?.[idx]?.totalMarks) || 0), 0),
    [fields, watchedChapters]
  );

  const openCreate = () => {
    setActiveId(null);
    reset({ subject: '', class: '', totalMarks: 100, chapters: [emptyChapter()] });
    setModalOpen(true);
  };

  const openEdit = (bp) => {
    setActiveId(bp._id);
    reset({
      subject: bp.subject?._id,
      class: bp.class?._id,
      totalMarks: bp.totalMarks,
      chapters: bp.chapters.map((c) => ({ ...c })),
    });
    setModalOpen(true);
  };

  const validate = () => {
    if (totalWeightage !== 100) {
      toast.error(`Weightage must total 100% (currently ${totalWeightage}%)`);
      return false;
    }
    if (totalChapterMarks !== Number(watch('totalMarks'))) {
      toast.error(`Chapter marks (${totalChapterMarks}) must equal total marks (${watch('totalMarks')})`);
      return false;
    }
    toast.success('Blueprint is valid');
    return true;
  };

  const onSave = async (formData) => {
    if (!validate()) return;
    const chapters = formData.chapters.slice(0, fields.length);
    const payload = {
      ...formData,
      totalMarks: Number(formData.totalMarks),
      chapters: chapters.map((c) => ({
        ...c,
        weightagePercent: Number(c.weightagePercent),
        totalMarks: Number(c.totalMarks),
        bloomLevels: Object.fromEntries(Object.entries(c.bloomLevels).map(([k, v]) => [k, Number(v)])),
        difficulty: Object.fromEntries(Object.entries(c.difficulty).map(([k, v]) => [k, Number(v)])),
      })),
      status: 'saved',
    };

    if (activeId) {
      await updateBlueprint.mutateAsync({ id: activeId, payload });
    } else {
      await createBlueprint.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Blueprint Builder"
        subtitle="Design chapter-wise weightage, Bloom's taxonomy and difficulty distribution"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Create Blueprint
          </button>
        }
      />

      <Card className="p-4 sm:p-5 mb-4">
        <select className="input-field sm:w-64" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {(subjects || []).map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : blueprints?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blueprints.map((bp) => (
            <Card key={bp._id} className="p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{bp.subject?.name}</h3>
                  <p className="text-xs text-slate-400">{bp.class?.name} {bp.class?.section} &middot; {bp.totalMarks} marks total</p>
                </div>
                <Badge color={bp.status === 'saved' ? 'green' : 'slate'} className="capitalize">{bp.status}</Badge>
              </div>
              <div className="space-y-1.5 mb-4">
                {bp.chapters.slice(0, 4).map((c) => (
                  <div key={c.chapter} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 truncate">{c.chapter}</span>
                    <span className="text-slate-400">{c.weightagePercent}% &middot; {c.totalMarks}m</span>
                  </div>
                ))}
                {bp.chapters.length > 4 && <p className="text-xs text-slate-400">+{bp.chapters.length - 4} more chapters</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(bp)} className="btn-secondary flex-1 text-xs py-2">
                  Edit
                </button>
                <button
                  onClick={() => deleteBlueprint.mutate(bp._id)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <FileStack size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No blueprints yet. Create your first exam blueprint.</p>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeId ? 'Edit Blueprint' : 'Create Blueprint'} size="xl">
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Class</label>
              <select className="input-field" {...register('class', { required: true })}>
                <option value="">Select class</option>
                {(classes || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Subject</label>
              <select className="input-field" {...register('subject', { required: true })}>
                <option value="">Select subject</option>
                {(subjects || []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Total Marks</label>
              <input type="number" className="input-field" {...register('totalMarks', { required: true })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700">Chapters</h4>
              <button
                type="button"
                onClick={() => append(emptyChapter())}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Chapter
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left font-semibold text-slate-500 px-3 py-2.5 min-w-[140px]">Chapter</th>
                    <th className="text-left font-semibold text-slate-500 px-2 py-2.5 w-20">Weight %</th>
                    <th className="text-left font-semibold text-slate-500 px-2 py-2.5 w-20">Marks</th>
                    <th colSpan={6} className="text-center font-semibold text-slate-500 px-2 py-2.5 border-l border-slate-100">
                      Bloom's Level Distribution (%)
                    </th>
                    <th colSpan={3} className="text-center font-semibold text-slate-500 px-2 py-2.5 border-l border-slate-100">
                      Difficulty (%)
                    </th>
                    <th className="w-10"></th>
                  </tr>
                  <tr className="bg-slate-50">
                    <th colSpan={3}></th>
                    {['Rem', 'Und', 'App', 'Ana', 'Eval', 'Create'].map((l) => (
                      <th key={l} className="text-center font-medium text-slate-400 px-1 py-1 border-l border-slate-100">{l}</th>
                    ))}
                    {['Easy', 'Med', 'Hard'].map((l) => (
                      <th key={l} className="text-center font-medium text-slate-400 px-1 py-1 border-l border-slate-100">{l}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fields.map((field, idx) => (
                    <tr key={field.id}>
                      <td className="px-2 py-2">
                        <input className="input-field !py-1.5 !px-2 text-xs" placeholder="e.g. Trigonometry" {...register(`chapters.${idx}.chapter`, { required: true })} />
                      </td>
                      <td className="px-1 py-2">
                        <input type="number" className="input-field !py-1.5 !px-2 text-xs w-16" {...register(`chapters.${idx}.weightagePercent`)} />
                      </td>
                      <td className="px-1 py-2">
                        <input type="number" className="input-field !py-1.5 !px-2 text-xs w-16" {...register(`chapters.${idx}.totalMarks`)} />
                      </td>
                      {['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map((b) => (
                        <td key={b} className="px-1 py-2 border-l border-slate-50">
                          <input type="number" className="input-field !py-1.5 !px-1.5 text-xs w-12 text-center" {...register(`chapters.${idx}.bloomLevels.${b}`)} />
                        </td>
                      ))}
                      {['easy', 'medium', 'hard'].map((d) => (
                        <td key={d} className="px-1 py-2 border-l border-slate-50">
                          <input type="number" className="input-field !py-1.5 !px-1.5 text-xs w-12 text-center" {...register(`chapters.${idx}.difficulty.${d}`)} />
                        </td>
                      ))}
                      <td className="px-1 py-2 text-center">
                        <button type="button" onClick={() => remove(idx)} className="text-slate-300 hover:text-rose-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className={totalWeightage === 100 ? 'text-primary-600 font-medium' : 'text-amber-600 font-medium'}>
                Total Weightage: {totalWeightage}%
              </span>
              <span className={totalChapterMarks === Number(watch('totalMarks')) ? 'text-primary-600 font-medium' : 'text-amber-600 font-medium'}>
                Total Marks: {totalChapterMarks} / {watch('totalMarks')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={validate} className="btn-secondary">
              <CheckCircle2 size={16} /> Validate
            </button>
            <button type="submit" disabled={createBlueprint.isPending || updateBlueprint.isPending} className="btn-primary">
              <Save size={16} /> Save Blueprint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
