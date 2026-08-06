import React, { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { enquiryService } from '../services/enquiryService';
import KanbanColumn from '../components/kanban/KanbanColumn';
import { Modal } from '../components/common/Modal';
import { LoadingBlock, Badge } from '../components/common/UI';

const STAGES = ['New', 'Contacted', 'Follow-up', 'Interested', 'Application Started', 'Converted', 'Lost'];
const SOURCES = ['Walk-in', 'Website', 'Referral', 'Facebook Ads', 'Agent', 'Other'];
const CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];

const Enquiries = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [addModal, setAddModal] = useState(null); // stage or null
  const [lostModal, setLostModal] = useState(null); // { enquiryId, targetStage }
  const [detail, setDetail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['kanban-board', search, sourceFilter],
    queryFn: () => enquiryService.board({ search: search || undefined, source: sourceFilter || undefined }),
  });

  const board = data?.data?.board || {};
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const enquiry = active.data.current.enquiry;
    const targetStage = over.id;
    if (enquiry.stage === targetStage) return;

    if (targetStage === 'Lost') {
      setLostModal({ enquiryId: enquiry._id, targetStage });
      return;
    }

    try {
      await enquiryService.updateStage(enquiry._id, { stage: targetStage });
      qc.invalidateQueries({ queryKey: ['kanban-board'] });
      toast.success(`Moved to ${targetStage}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmLost = async (reason) => {
    try {
      await enquiryService.updateStage(lostModal.enquiryId, { stage: 'Lost', lostReason: reason });
      qc.invalidateQueries({ queryKey: ['kanban-board'] });
      toast.success('Marked as Lost');
      setLostModal(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-lg font-bold text-gray-800">Enquiry Kanban Board</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enquiry..."
              className="pl-7 pr-2.5 py-2 text-sm border border-gray-200 rounded-lg w-48"
            />
          </div>
          <button
            onClick={() => setAddModal('New')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus size={15} /> Add Enquiry
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                enquiries={board[stage] || []}
                onOpen={setDetail}
                onAdd={setAddModal}
              />
            ))}
          </div>
        </DndContext>
      )}

      <AddEnquiryModal
        open={!!addModal}
        defaultStage={addModal}
        onClose={() => setAddModal(null)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['kanban-board'] })}
      />

      <LostReasonModal open={!!lostModal} onClose={() => setLostModal(null)} onConfirm={confirmLost} />

      <EnquiryDetailModal
        enquiry={detail}
        onClose={() => setDetail(null)}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['kanban-board'] })}
      />
    </div>
  );
};

const AddEnquiryModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ studentName: '', parentName: '', phone: '', email: '', classAppliedFor: 'Nursery', source: 'Walk-in', sourceDetail: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await enquiryService.create(form);
      toast.success('Enquiry logged');
      onCreated();
      onClose();
      setForm({ studentName: '', parentName: '', phone: '', email: '', classAppliedFor: 'Nursery', source: 'Walk-in', sourceDetail: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log New Enquiry">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <Field label="Student Name" required value={form.studentName} onChange={(v) => setForm({ ...form, studentName: v })} />
        <Field label="Parent Name" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
        <Field label="Phone" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <div>
          <label className="block text-gray-600 mb-1">Class Applied For</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2" value={form.classAppliedFor} onChange={(e) => setForm({ ...form, classAppliedFor: e.target.value })}>
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Source</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Field label="Source Detail (optional)" value={form.sourceDetail} onChange={(v) => setForm({ ...form, sourceDetail: v })} />
        <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Saving...' : 'Log Enquiry'}
        </button>
      </form>
    </Modal>
  );
};

const LostReasonModal = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Reason for marking as Lost" width="max-w-sm">
      <p className="text-xs text-gray-500 mb-2">A reason code is mandatory before moving a card to Lost.</p>
      <textarea
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        rows={3}
        placeholder="e.g. Joined another school, No response, Fee concerns..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button
        disabled={!reason.trim()}
        onClick={() => {
          onConfirm(reason);
          setReason('');
        }}
        className="mt-3 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm"
      >
        Confirm & Mark Lost
      </button>
    </Modal>
  );
};

const EnquiryDetailModal = ({ enquiry, onClose, onUpdated }) => {
  const [note, setNote] = useState('');
  if (!enquiry) return null;

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await enquiryService.addContactLog(enquiry._id, note);
      toast.success('Note added');
      setNote('');
      onUpdated();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={!!enquiry} onClose={onClose} title={enquiry.studentName}>
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <Badge>{enquiry.stage}</Badge>
          <span>&middot; {enquiry.source}</span>
          <span>&middot; {enquiry.classAppliedFor}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-gray-600">
          <p><span className="text-gray-400">Phone:</span> {enquiry.phone}</p>
          <p><span className="text-gray-400">Email:</span> {enquiry.email || '-'}</p>
          <p><span className="text-gray-400">Parent:</span> {enquiry.parentName || '-'}</p>
          <p><span className="text-gray-400">Counselor:</span> {enquiry.counselor?.name || 'Unassigned'}</p>
        </div>
        {enquiry.lostReason && <p className="text-red-600 text-xs">Lost reason: {enquiry.lostReason}</p>}

        <div className="border-t border-gray-100 pt-3">
          <p className="font-medium text-gray-700 mb-2">Contact Log</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {(enquiry.contactLog || []).length === 0 && <p className="text-xs text-gray-400">No notes yet</p>}
            {(enquiry.contactLog || []).map((c, i) => (
              <p key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                {c.note} <span className="text-gray-400">&middot; {new Date(c.at).toLocaleString('en-IN')}</span>
              </p>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a follow-up note..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={addNote} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 rounded-lg">
              Add
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const Field = ({ label, value, onChange, required }) => (
  <div>
    <label className="block text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2"
    />
  </div>
);

export default Enquiries;
