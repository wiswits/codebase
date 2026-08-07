import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { interviewService } from '../services/domainServices';
import { authService } from '../services/domainServices';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const Interviews = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [scoreTarget, setScoreTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['interviews'], queryFn: () => interviewService.list({}) });
  const interviews = data?.data?.interviews || [];

  const markNoShow = async (id) => {
    try {
      await interviewService.markNoShow(id);
      toast.success('No-show recorded, auto-reschedule attempted');
      qc.invalidateQueries({ queryKey: ['interviews'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Interview Schedule</h1>
        {user.role !== 'panelist' && (
          <button onClick={() => setGenerateOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <Plus size={15} /> Generate Slots
          </button>
        )}
      </div>

      <Card title="Scheduled Interviews">
        {isLoading ? (
          <LoadingBlock />
        ) : interviews.length === 0 ? (
          <EmptyState label="No interviews scheduled yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Application No.</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Slot</th>
                  <th className="py-2 pr-3">Panel</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((iv) => (
                  <tr key={iv._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-3">{iv.application?.student?.name}</td>
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{iv.application?.applicationNo}</td>
                    <td className="py-2.5 pr-3">{iv.slot ? new Date(iv.slot.date).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="py-2.5 pr-3">{iv.slot ? `${iv.slot.startTime} - ${iv.slot.endTime}` : '-'}</td>
                    <td className="py-2.5 pr-3">{iv.slot?.panelLabel || '-'}</td>
                    <td className="py-2.5 pr-3"><Badge>{iv.status}</Badge></td>
                    <td className="py-2.5 pr-3">{iv.aggregateScore ? `${iv.aggregateScore}/10` : '-'}</td>
                    <td className="py-2.5 pr-3 flex gap-2">
                      {iv.status !== 'Completed' && (
                        <button onClick={() => setScoreTarget(iv)} className="text-blue-600 text-xs font-medium hover:underline">
                          Score
                        </button>
                      )}
                      {iv.status === 'Scheduled' && (
                        <button onClick={() => markNoShow(iv._id)} className="text-amber-600 text-xs font-medium hover:underline">
                          No-show
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GenerateSlotsModal open={generateOpen} onClose={() => setGenerateOpen(false)} onDone={() => qc.invalidateQueries({ queryKey: ['interviews'] })} />
      <ScoreModal interview={scoreTarget} onClose={() => setScoreTarget(null)} onDone={() => qc.invalidateQueries({ queryKey: ['interviews'] })} />
    </div>
  );
};

const RUBRIC = ['Communication', 'Subject Knowledge', 'Confidence', 'Behavior', 'Overall Impression'];

const ScoreModal = ({ interview, onClose, onDone }) => {
  const [scores, setScores] = useState({});
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  if (!interview) return null;

  const submit = async () => {
    if (Object.keys(scores).length !== RUBRIC.length) {
      toast.error('Please score every rubric parameter');
      return;
    }
    setSaving(true);
    try {
      await interviewService.submitScore(interview._id, scores, remarks);
      toast.success('Score submitted');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!interview} onClose={onClose} title={`Score — ${interview.application?.student?.name}`} width="max-w-md">
      <div className="space-y-3 text-sm">
        {RUBRIC.map((param) => (
          <div key={param} className="flex items-center justify-between">
            <span className="text-gray-600">{param}</span>
            <input
              type="number"
              min={1}
              max={10}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center"
              value={scores[param] || ''}
              onChange={(e) => setScores({ ...scores, [param]: Number(e.target.value) })}
            />
          </div>
        ))}
        <textarea
          placeholder="Remarks (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <button disabled={saving} onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Submitting...' : 'Submit Score'}
        </button>
      </div>
    </Modal>
  );
};

const GenerateSlotsModal = ({ open, onClose, onDone }) => {
  const { data } = useQuery({ queryKey: ['panelists'], queryFn: () => authService.users('panelist'), enabled: open });
  const panelists = data?.data?.users || [];
  const [form, setForm] = useState({ classApplied: 'Class 5', startDate: '', endDate: '', durationMinutes: 30, panelLabel: 'Panel A', panelistIds: [] });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await interviewService.generateSlots({
        classApplied: form.classApplied,
        startDate: form.startDate,
        endDate: form.endDate,
        durationMinutes: Number(form.durationMinutes),
        panels: [{ label: form.panelLabel, panelistIds: form.panelistIds, capacityPerSlot: 1 }],
      });
      toast.success(`${res.data.count} slots generated`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Interview Slots">
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">Class</label>
          <input value={form.classApplied} onChange={(e) => setForm({ ...form, classApplied: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-600 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Slot Duration (minutes)</label>
          <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Panel Label</label>
          <input value={form.panelLabel} onChange={(e) => setForm({ ...form, panelLabel: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Panelists</label>
          <select
            multiple
            className="w-full border border-gray-200 rounded-lg px-3 py-2 h-24"
            value={form.panelistIds}
            onChange={(e) => setForm({ ...form, panelistIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
          >
            {panelists.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <button disabled={saving || !form.startDate || !form.endDate} onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Generating...' : 'Generate Slots'}
        </button>
      </div>
    </Modal>
  );
};

export default Interviews;
