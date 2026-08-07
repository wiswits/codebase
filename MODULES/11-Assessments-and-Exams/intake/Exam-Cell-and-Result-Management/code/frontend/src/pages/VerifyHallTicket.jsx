import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ShieldCheck, ShieldX, GraduationCap, Loader2 } from 'lucide-react';
import api from '../api/axios.js';

export default function VerifyHallTicket() {
  const { ticketNo } = useParams();
  const [state, setState] = useState({ loading: true, valid: false, data: null, message: '' });

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/verify/hallticket/${ticketNo}`)
      .then((res) => {
        if (cancelled) return;
        setState({ loading: false, valid: res.data.valid, data: res.data.data, message: res.data.message });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, valid: false, data: null, message: 'Could not verify this hall ticket right now.' });
      });
    return () => {
      cancelled = true;
    };
  }, [ticketNo]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">ECRMS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          {state.loading ? (
            <div className="p-10 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary-500" />
              <p className="text-sm text-slate-400">Verifying hall ticket...</p>
            </div>
          ) : state.valid ? (
            <>
              <div className="bg-primary-500 text-white px-6 py-5 flex items-center gap-3">
                <ShieldCheck size={28} />
                <div>
                  <p className="font-bold text-lg">Valid Hall Ticket</p>
                  <p className="text-xs opacity-80">{state.data.ticketNo}</p>
                </div>
              </div>
              <div className="p-6 space-y-2.5 text-sm">
                <Row label="Student" value={state.data.studentName} />
                <Row label="Roll No" value={state.data.rollNo} />
                <Row label="Class" value={state.data.className} />
                <Row label="Exam" value={state.data.examName} />
                <Row label="Subject" value={state.data.subject} />
                <Row label="Date" value={state.data.date ? format(new Date(state.data.date), 'dd MMM yyyy') : '-'} />
                <Row label="Room" value={state.data.room || 'TBD'} />
              </div>
            </>
          ) : (
            <>
              <div className="bg-rose-500 text-white px-6 py-5 flex items-center gap-3">
                <ShieldX size={28} />
                <p className="font-bold text-lg">Invalid Ticket</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500">{state.message || 'This hall ticket number could not be found.'}</p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">This page is public and requires no login.</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  );
}
