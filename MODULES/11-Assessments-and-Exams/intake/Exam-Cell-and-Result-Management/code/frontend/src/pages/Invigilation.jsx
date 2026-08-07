import { useState } from 'react';
import { format } from 'date-fns';
import { ShieldCheck, Users2, Wand2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table } from '../components/ui/Table.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useInvigilations, useAutoAssignInvigilators } from '../hooks/useInvigilation.js';

const STATUS_COLOR = { assigned: 'amber', confirmed: 'green', completed: 'slate' };

export default function Invigilation() {
  const [date, setDate] = useState(format(new Date('2026-08-20'), 'yyyy-MM-dd'));
  const { data: assignments, isLoading } = useInvigilations({ date });
  const autoAssign = useAutoAssignInvigilators();

  return (
    <div>
      <PageHeader
        title="Invigilation Management"
        subtitle="Assign invigilators to exams and rooms"
        actions={
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            <button
              onClick={() => autoAssign.mutate({ date })}
              disabled={autoAssign.isPending}
              className="btn-primary"
            >
              <Wand2 size={16} /> {autoAssign.isPending ? 'Assigning...' : 'Auto Assign'}
            </button>
          </div>
        }
      />

      <Card className="p-4 sm:p-5">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : assignments?.length ? (
          <Table columns={['Exam', 'Room', 'Time', 'Class', 'Invigilators', 'Status']}>
            {assignments.map((a) => (
              <tr key={a._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-3 whitespace-nowrap text-slate-700 font-medium">{a.exam?.name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{a.room}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{a.startTime} - {a.endTime}</td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{a.exam?.class?.name} {a.exam?.class?.section}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.invigilators.map((inv) => (
                      <Badge key={inv._id} color="slate">{inv.name}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Badge color={STATUS_COLOR[a.status]} className="capitalize">{a.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="text-center py-16">
            <ShieldCheck size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No invigilation assignments for this date.</p>
            <p className="text-xs text-slate-400 mt-1">Click Auto Assign to assign invigilators to every exam scheduled on this date.</p>
          </div>
        )}
      </Card>

      <Card className="p-5 mt-4 flex items-start gap-3 bg-primary-50/40 border-primary-100">
        <Users2 size={20} className="text-primary-600 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          Auto Assign rotates through your pool of active invigilators (added via Settings &rarr; Users & Roles)
          and assigns a primary + secondary invigilator to every exam scheduled on the selected date.
        </p>
      </Card>
    </div>
  );
}
