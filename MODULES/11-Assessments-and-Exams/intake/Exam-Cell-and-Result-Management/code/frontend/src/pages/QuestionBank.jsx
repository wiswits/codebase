import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Trash2, Pencil, BookOpenCheck, UploadCloud, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table, Pagination } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useBulkImportQuestions } from '../hooks/useQuestions.js';
import { useSubjects } from '../hooks/useExams.js';

const DIFFICULTY_COLOR = { easy: 'green', medium: 'amber', hard: 'red' };
const TYPE_LABEL = {
  mcq: 'MCQ',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  case_study: 'Case Study',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

// Minimal CSV parser for a controlled, known column layout — good enough for
// the "download template, fill it, re-upload" workflow without a heavy dependency.
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

export default function QuestionBank() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuestions({ page, limit: 10, search, difficulty });
  const { data: subjects } = useSubjects();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const bulkImport = useBulkImportQuestions();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { questionType: 'mcq', marks: 1, bloomLevel: 'remember', difficulty: 'easy' },
  });
  const watchType = watch('questionType');

  const openCreate = () => {
    setEditingQuestion(null);
    reset({ questionType: 'mcq', marks: 1, bloomLevel: 'remember', difficulty: 'easy', questionText: '', chapter: '', subject: '', options: '' });
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    reset({
      questionText: q.questionText,
      subject: q.subject?._id,
      chapter: q.chapter,
      questionType: q.questionType,
      bloomLevel: q.bloomLevel,
      difficulty: q.difficulty,
      marks: q.marks,
      options: (q.options || []).join(', '),
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    const payload = { ...formData, marks: Number(formData.marks) };
    if (formData.questionType === 'mcq' && formData.options) {
      payload.options = formData.options.split(',').map((o) => o.trim()).filter(Boolean);
    } else {
      delete payload.options;
    }
    if (editingQuestion) {
      await updateQuestion.mutateAsync({ id: editingQuestion._id, payload });
    } else {
      await createQuestion.mutateAsync(payload);
    }
    reset();
    setModalOpen(false);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const questions = rows
      .filter((r) => r.questionText && r.subject && r.chapter)
      .map((r) => ({
        questionText: r.questionText,
        subject: r.subject,
        chapter: r.chapter,
        questionType: r.questionType || 'short_answer',
        marks: Number(r.marks) || 1,
        bloomLevel: r.bloomLevel || 'remember',
        difficulty: r.difficulty || 'easy',
        options: r.options ? r.options.split('|').map((o) => o.trim()).filter(Boolean) : undefined,
        correctAnswer: r.correctAnswer || undefined,
      }));
    if (questions.length > 0) await bulkImport.mutateAsync(questions);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const header = 'questionText,subject,chapter,questionType,marks,bloomLevel,difficulty,options,correctAnswer\n';
    const sampleSubjectId = subjects?.[0]?._id || 'SUBJECT_OBJECT_ID';
    const sample = `What is 2 + 2?,${sampleSubjectId},Basic Arithmetic,mcq,1,remember,easy,2|3|4|5,4\n`;
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'question-bank-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Manage your repository of exam questions"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate} className="btn-secondary text-xs sm:text-sm">
              <Download size={15} /> CSV Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={bulkImport.isPending} className="btn-secondary text-xs sm:text-sm">
              <UploadCloud size={15} /> {bulkImport.isPending ? 'Importing...' : 'Import CSV'}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} /> Add Question
            </button>
          </div>
        }
      />

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
            className="input-field sm:w-48"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data?.data?.length ? (
          <>
            <Table columns={['ID', 'Question', 'Subject', 'Chapter', 'Bloom Level', 'Difficulty', 'Marks', '']}>
              {data.data.map((q, idx) => (
                <tr key={q._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-3 py-3 text-slate-400 font-mono text-xs">Q{String(idx + 1 + (page - 1) * 10).padStart(3, '0')}</td>
                  <td className="px-3 py-3 max-w-xs">
                    <p className="truncate text-slate-700">{q.questionText}</p>
                    <span className="text-[11px] text-slate-400">{TYPE_LABEL[q.questionType]}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-500">{q.subject?.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-500">{q.chapter}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge color="slate" className="capitalize">{q.bloomLevel}</Badge>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge color={DIFFICULTY_COLOR[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-500">{q.marks}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(q)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteQuestion.mutate(q._id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpenCheck size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No questions found. Add your first question to the bank.</p>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingQuestion ? 'Edit Question' : 'Add New Question'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Question Text</label>
            <textarea rows={3} className="input-field" placeholder="Enter the question..." {...register('questionText', { required: true })} />
            {errors.questionText && <p className="text-xs text-rose-500 mt-1">Question text is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Chapter</label>
              <input className="input-field" placeholder="e.g. Trigonometry" {...register('chapter', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Question Type</label>
              <select className="input-field" {...register('questionType')}>
                {Object.entries(TYPE_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Bloom's Level</label>
              <select className="input-field" {...register('bloomLevel')}>
                <option value="remember">Remember</option>
                <option value="understand">Understand</option>
                <option value="apply">Apply</option>
                <option value="analyze">Analyze</option>
                <option value="evaluate">Evaluate</option>
                <option value="create">Create</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Difficulty</label>
              <select className="input-field" {...register('difficulty')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {watchType === 'mcq' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Options (comma separated)</label>
              <input className="input-field" placeholder="Option A, Option B, Option C, Option D" {...register('options')} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Marks</label>
            <input type="number" min={1} className="input-field w-32" {...register('marks', { required: true })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createQuestion.isPending || updateQuestion.isPending} className="btn-primary">
              {createQuestion.isPending || updateQuestion.isPending ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
