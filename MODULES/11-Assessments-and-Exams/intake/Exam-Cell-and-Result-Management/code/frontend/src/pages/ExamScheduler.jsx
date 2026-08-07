import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useExamCalendar, useClasses, useSubjects, useCreateExam, useUpdateExam, useDeleteExam } from '../hooks/useExams.js';

const EXAM_COLORS = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-rose-100 text-rose-700 border-rose-200',
];

export default function ExamScheduler() {
  const [cursor, setCursor] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingExam, setEditingExam] = useState(null);

  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();

  const { data: exams, isLoading } = useExamCalendar(month, year);
  const { data: classes } = useClasses();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const watchedClass = watch('class');
  const { data: subjects } = useSubjects(watchedClass);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const examsByDay = useMemo(() => {
    const map = {};
    (exams || []).forEach((exam) => {
      const key = format(new Date(exam.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(exam);
    });
    return map;
  }, [exams]);

  const openAddModal = (day) => {
    setEditingExam(null);
    setSelectedDay(day);
    reset({ date: format(day || new Date(), 'yyyy-MM-dd'), duration: 90, totalMarks: 100, room: '', examType: 'unit_test' });
    setModalOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    reset({
      name: exam.name,
      examType: exam.examType,
      class: exam.class?._id,
      subject: exam.subject?._id,
      date: format(new Date(exam.date), 'yyyy-MM-dd'),
      room: exam.room || '',
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      studentsAppearing: exam.studentsAppearing,
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    const payload = {
      ...formData,
      duration: Number(formData.duration),
      totalMarks: Number(formData.totalMarks),
      studentsAppearing: Number(formData.studentsAppearing || 0),
    };
    if (editingExam) {
      await updateExam.mutateAsync({ id: editingExam._id, payload });
    } else {
      await createExam.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Exam Scheduler"
        subtitle="Plan and manage examinations across all classes"
        actions={
          <button onClick={() => openAddModal(new Date())} className="btn-primary">
            <Plus size={16} /> Add Exam
          </button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 text-lg">{format(cursor, 'MMMM yyyy')}</h3>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCursor(new Date())} className="btn-secondary px-3 py-1.5 text-xs">
              Today
            </button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 pb-2">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayExams = examsByDay[key] || [];
              const inMonth = isSameMonth(day, cursor);
              const today = isSameDay(day, new Date());
              return (
                <button
                  key={key}
                  onClick={() => openAddModal(day)}
                  className={`min-h-[90px] sm:min-h-[110px] text-left p-1.5 sm:p-2 rounded-xl border transition ${
                    inMonth ? 'bg-white border-slate-100 hover:border-primary-200' : 'bg-slate-50/50 border-transparent'
                  }`}
                >
                  <span
                    className={`text-xs font-medium inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      today ? 'bg-primary-500 text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayExams.slice(0, 2).map((exam, i) => (
                      <div
                        key={exam._id}
                        className={`text-[10px] sm:text-[11px] px-1.5 py-1 rounded-md border truncate ${EXAM_COLORS[i % EXAM_COLORS.length]}`}
                        title={exam.name}
                      >
                        <p className="font-medium truncate">{exam.subject?.name}</p>
                        <p className="truncate opacity-80">{exam.class?.name} {exam.class?.section}</p>
                      </div>
                    ))}
                    {dayExams.length > 2 && (
                      <p className="text-[10px] text-slate-400 pl-1">+{dayExams.length - 2} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5 mt-4">
        <h3 className="font-semibold text-slate-800 mb-4">This Month's Exams</h3>
        <div className="divide-y divide-slate-50">
          {(exams || []).length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No exams scheduled this month</p>}
          {(exams || []).map((exam) => (
            <div key={exam._id} className="flex items-center justify-between py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{exam.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(exam.date), 'dd MMM')} &middot; {exam.startTime}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {exam.room || 'TBD'}</span>
                  <span>{exam.class?.name} {exam.class?.section}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(exam)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteExam.mutate(exam._id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingExam ? 'Edit Exam' : 'Schedule New Exam'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exam Name</label>
            <input className="input-field" placeholder="e.g. Mid Term Examination" {...register('name', { required: true })} />
            {errors.name && <p className="text-xs text-rose-500 mt-1">Exam name is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exam Type</label>
              <select className="input-field" {...register('examType')}>
                <option value="unit_test">Unit Test</option>
                <option value="mid_term">Mid Term</option>
                <option value="semester_end">Semester End</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Class</label>
              <select className="input-field" {...register('class', { required: true })}>
                <option value="">Select class</option>
                {(classes || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Subject</label>
            <select className="input-field" {...register('subject', { required: true })}>
              <option value="">Select subject</option>
              {(subjects || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date</label>
              <input type="date" className="input-field" {...register('date', { required: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Room</label>
              <input className="input-field" placeholder="Room 101" {...register('room')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Time</label>
              <input type="time" className="input-field" {...register('startTime', { required: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time</label>
              <input type="time" className="input-field" {...register('endTime', { required: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (min)</label>
              <input type="number" className="input-field" {...register('duration', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Total Marks</label>
              <input type="number" className="input-field" {...register('totalMarks')} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Students Appearing</label>
              <input type="number" className="input-field" {...register('studentsAppearing')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createExam.isPending || updateExam.isPending} className="btn-primary">
              {createExam.isPending || updateExam.isPending ? 'Saving...' : editingExam ? 'Update Exam' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
