import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CreditCard, Download, Search, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Table } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useExamsList } from '../hooks/useSeating.js';
import { useHallTickets, useGenerateHallTickets, downloadHallTicketPdf } from '../hooks/useHallTickets.js';

export default function HallTickets() {
  const [selectedExam, setSelectedExam] = useState('');
  const [search, setSearch] = useState('');
  const [previewTicket, setPreviewTicket] = useState(null);

  const { data: exams } = useExamsList();
  const { data: tickets, isLoading } = useHallTickets(selectedExam ? { exam: selectedExam } : {});
  const generateTickets = useGenerateHallTickets();

  const { handleSubmit } = useForm();

  const onGenerate = async () => {
    if (!selectedExam) return;
    await generateTickets.mutateAsync({ examId: selectedExam });
  };

  const filtered = (tickets || []).filter(
    (t) =>
      !search ||
      t.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.student?.rollNo?.includes(search)
  );

  return (
    <div>
      <PageHeader title="Hall Tickets" subtitle="Bulk-generate hall tickets with QR codes for an exam" />

      <Card className="p-5 mb-6">
        <form onSubmit={handleSubmit(onGenerate)} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exam</label>
            <select className="input-field" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
              <option value="">Select exam</option>
              {(exams || []).map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name} &middot; {exam.class?.name} {exam.class?.section}
                </option>
              ))}
            </select>
          </div>
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-10" placeholder="Search by name or roll no." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sm:col-span-4">
            <button type="submit" disabled={!selectedExam || generateTickets.isPending} className="btn-primary">
              <Sparkles size={16} /> {generateTickets.isPending ? 'Generating...' : 'Generate Hall Tickets'}
            </button>
          </div>
        </form>
        {!selectedExam && <p className="text-xs text-amber-600 mt-3">Select an exam to generate or view its hall tickets.</p>}
      </Card>

      <Card className="p-4 sm:p-5">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length ? (
          <Table columns={['Ticket No', 'Student', 'Roll No', 'Exam', 'Room', '']}>
            {filtered.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{t.ticketNo}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-700 font-medium">{t.student?.name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{t.student?.rollNo}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{t.exam?.name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{t.room || 'TBD'}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setPreviewTicket(t)} className="btn-secondary text-xs py-1.5 px-3">
                      Preview
                    </button>
                    <button
                      onClick={() => downloadHallTicketPdf(t._id, t.ticketNo)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="text-center py-16">
            <CreditCard size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">
              {selectedExam ? 'No hall tickets generated yet for this exam.' : 'Select an exam above to get started.'}
            </p>
          </div>
        )}
      </Card>

      <Modal open={!!previewTicket} onClose={() => setPreviewTicket(null)} title="Hall Ticket Preview" size="sm">
        {previewTicket && (
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            <div className="bg-primary-500 text-white px-5 py-4">
              <p className="font-bold text-lg">ECRMS</p>
              <p className="text-xs opacity-80">Hall Ticket</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{previewTicket.exam?.name}</p>
                  <p className="text-xs text-slate-400">{previewTicket.ticketNo}</p>
                </div>
                {previewTicket.qrCodeData && <img src={previewTicket.qrCodeData} alt="QR Code" className="h-16 w-16" />}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-400">Student</span>
                <span className="text-slate-700 text-right">{previewTicket.student?.name}</span>
                <span className="text-slate-400">Roll No</span>
                <span className="text-slate-700 text-right">{previewTicket.student?.rollNo}</span>
                <span className="text-slate-400">Class</span>
                <span className="text-slate-700 text-right">{previewTicket.exam?.class?.name} {previewTicket.exam?.class?.section}</span>
                <span className="text-slate-400">Date</span>
                <span className="text-slate-700 text-right">{previewTicket.exam?.date ? format(new Date(previewTicket.exam.date), 'dd MMM yyyy') : '-'}</span>
                <span className="text-slate-400">Room</span>
                <span className="text-slate-700 text-right">{previewTicket.room || 'TBD'}</span>
              </div>
              <button
                onClick={() => downloadHallTicketPdf(previewTicket._id, previewTicket.ticketNo)}
                className="btn-primary w-full mt-2"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
