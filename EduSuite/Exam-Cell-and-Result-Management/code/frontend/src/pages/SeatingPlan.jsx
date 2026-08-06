import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Grid3x3, Shuffle, Save, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList, useSeatingPlans, useGenerateSeatingPlan, useUpdateSeatingPlan } from '../hooks/useSeating.js';

const ITEM_TYPE = 'SEAT';

function Seat({ seat, onSwap, colCount }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: { seatNo: seat.seatNo },
    canDrag: !seat.isEmpty,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => onSwap(item.seatNo, seat.seatNo),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={(node) => dragRef(dropRef(node))}
      className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-center p-1 transition select-none ${
        seat.isEmpty
          ? 'border-dashed border-slate-200 bg-slate-50/50 text-slate-300'
          : `border-primary-200 bg-primary-50 text-primary-800 cursor-grab active:cursor-grabbing ${
              isDragging ? 'opacity-30' : 'opacity-100'
            } ${isOver ? 'ring-2 ring-primary-400' : ''}`
      }`}
      title={seat.isEmpty ? 'Empty seat' : `${seat.rollNo || ''}`}
    >
      {seat.isEmpty ? (
        <span className="text-[10px]">Empty</span>
      ) : (
        <>
          <UserIcon size={13} />
          <span className="text-[10px] font-semibold mt-0.5">{seat.rollNo}</span>
        </>
      )}
    </div>
  );
}

export default function SeatingPlan() {
  const [selectedExam, setSelectedExam] = useState('');
  const [room, setRoom] = useState('Room 101');
  const [localSeats, setLocalSeats] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);

  const { data: exams } = useExamsList();
  const { data: plans, isLoading } = useSeatingPlans(selectedExam || undefined);
  const generatePlan = useGenerateSeatingPlan();
  const updatePlan = useUpdateSeatingPlan();

  const { register, handleSubmit } = useForm({
    defaultValues: { rows: 6, cols: 6, arrangement: 'zigzag' },
  });

  const currentPlan = useMemo(() => {
    if (localSeats) return localSeats;
    return plans?.find((p) => p._id === activePlanId) || plans?.[0] || null;
  }, [plans, activePlanId, localSeats]);

  const onGenerate = async (formData) => {
    if (!selectedExam) return;
    const result = await generatePlan.mutateAsync({
      examId: selectedExam,
      room,
      rows: Number(formData.rows),
      cols: Number(formData.cols),
      arrangement: formData.arrangement,
    });
    setActivePlanId(result._id);
    setLocalSeats(null);
  };

  const handleSwap = (seatNoA, seatNoB) => {
    if (seatNoA === seatNoB || !currentPlan) return;
    const seats = currentPlan.seats.map((s) => ({ ...s }));
    const a = seats.find((s) => s.seatNo === seatNoA);
    const b = seats.find((s) => s.seatNo === seatNoB);
    if (!a || !b) return;
    [a.student, a.rollNo, a.isEmpty, b.student, b.rollNo, b.isEmpty] = [
      b.student,
      b.rollNo,
      b.isEmpty,
      a.student,
      a.rollNo,
      a.isEmpty,
    ];
    setLocalSeats({ ...currentPlan, seats });
  };

  const handleSaveArrangement = async () => {
    if (!currentPlan) return;
    await updatePlan.mutateAsync({ id: currentPlan._id, seats: currentPlan.seats });
    setLocalSeats(null);
  };

  const colCount = currentPlan?.seats?.length ? Math.max(...currentPlan.seats.map((s) => s.col)) : 6;

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <PageHeader title="Seating Plan" subtitle="Auto-generate and fine-tune exam seating arrangements" />

        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit(onGenerate)} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exam</label>
              <select
                className="input-field"
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setActivePlanId(null);
                  setLocalSeats(null);
                }}
              >
                <option value="">Select exam</option>
                {(exams || []).map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.name} &middot; {exam.class?.name} {exam.class?.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Room</label>
              <input className="input-field" value={room} onChange={(e) => setRoom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Rows x Cols</label>
              <div className="flex gap-2">
                <input type="number" min={1} className="input-field" {...register('rows')} />
                <input type="number" min={1} className="input-field" {...register('cols')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Arrangement</label>
              <select className="input-field" {...register('arrangement')}>
                <option value="zigzag">Zigzag</option>
                <option value="linear">Linear</option>
                <option value="shuffled">Shuffled</option>
              </select>
            </div>
            <div className="sm:col-span-5 flex gap-2">
              <button type="submit" disabled={!selectedExam || generatePlan.isPending} className="btn-primary">
                <Shuffle size={16} /> {generatePlan.isPending ? 'Generating...' : 'Auto Arrange'}
              </button>
              {localSeats && (
                <button type="button" onClick={handleSaveArrangement} disabled={updatePlan.isPending} className="btn-secondary">
                  <Save size={16} /> {updatePlan.isPending ? 'Saving...' : 'Save Arrangement'}
                </button>
              )}
            </div>
          </form>
          {!selectedExam && <p className="text-xs text-amber-600 mt-3">Select an exam to generate or view its seating plan.</p>}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">
                {currentPlan ? `Seating Plan - ${currentPlan.exam?.name || ''}` : 'Seating Grid'}
              </h3>
              <p className="text-xs text-slate-400">Drag a seat onto another to swap students</p>
            </div>
            {currentPlan && <span className="text-xs text-slate-400">Room: {currentPlan.room}</span>}
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : currentPlan ? (
            <div
              className="grid gap-1.5 sm:gap-2 max-w-2xl"
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            >
              {currentPlan.seats.map((seat) => (
                <Seat key={seat.seatNo} seat={seat} onSwap={handleSwap} colCount={colCount} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Grid3x3 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">
                {selectedExam ? 'No seating plan yet for this exam. Click Auto Arrange to generate one.' : 'Select an exam above to get started.'}
              </p>
            </div>
          )}

          {currentPlan && (
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary-100 border border-primary-200" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-dashed border-slate-200 bg-slate-50" /> Empty
              </span>
            </div>
          )}
        </Card>
      </div>
    </DndProvider>
  );
}
