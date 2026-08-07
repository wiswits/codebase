import { useState, useMemo, useEffect } from 'react';
import { Grid3x3, MapPin, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyClassExams } from '../hooks/useExams.js';
import { useSeatingPlans } from '../hooks/useSeating.js';

export default function StudentSeatingView() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState('');

  const { data: exams, isLoading: examsLoading } = useMyClassExams(user?.classAssigned);
  const { data: plans, isLoading: plansLoading } = useSeatingPlans(selectedExam || undefined);

  useEffect(() => {
    if (!selectedExam && exams?.length) setSelectedExam(exams[0]._id);
  }, [exams, selectedExam]);

  const plan = plans?.[0] || null;
  const colCount = plan?.seats?.length ? Math.max(...plan.seats.map((s) => s.col)) : 6;

  const mySeat = useMemo(() => plan?.seats?.find((s) => s.rollNo === user?.rollNo), [plan, user]);

  return (
    <div>
      <PageHeader
        title="My Seating Plan"
        subtitle="Find your seat for an upcoming exam"
        actions={
          <select className="input-field" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Select exam</option>
            {(exams || []).map((exam) => (
              <option key={exam._id} value={exam._id}>{exam.name}</option>
            ))}
          </select>
        }
      />

      {examsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !selectedExam ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <Grid3x3 size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Select an exam above to see your seating arrangement.</p>
        </Card>
      ) : plansLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : plan ? (
        <>
          {mySeat && (
            <Card className="p-5 mb-4 bg-primary-50/50 border-primary-100 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Your seat</p>
                <p className="text-lg font-bold text-slate-800">{mySeat.seatNo} &middot; Room {plan.room}</p>
              </div>
            </Card>
          )}

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{plan.exam?.name}</h3>
              <span className="text-xs text-slate-400">Room: {plan.room}</span>
            </div>
            <div className="grid gap-1.5 sm:gap-2 max-w-2xl" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
              {plan.seats.map((seat) => {
                const isMine = seat.rollNo === user?.rollNo;
                return (
                  <div
                    key={seat.seatNo}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-center p-1 ${
                      isMine
                        ? 'border-primary-500 bg-primary-500 text-white ring-2 ring-primary-300'
                        : seat.isEmpty
                        ? 'border-dashed border-slate-200 bg-slate-50/50 text-slate-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                    title={seat.isEmpty ? 'Empty' : seat.rollNo}
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
              })}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <Grid3x3 size={32} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Seating hasn't been arranged for this exam yet. Check back closer to the exam date.</p>
        </Card>
      )}
    </div>
  );
}
