import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';
import { quotaService } from '../services/domainServices';
import { Card, LoadingBlock, EmptyState } from '../components/common/UI';
import { Modal } from '../components/common/Modal';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];
const CATEGORIES = ['General', 'RTE', 'EWS', 'Sibling', 'Staff', 'Sports', 'Management'];

const Quotas = () => {
  const qc = useQueryClient();
  const [classFilter, setClassFilter] = useState('Class 5');
  const [configOpen, setConfigOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quota-dashboard', classFilter],
    queryFn: () => quotaService.dashboard({ classApplied: classFilter }),
  });

  const summary = data?.data?.summary || [];
  const totalSeats = summary.reduce((s, q) => s + q.totalSeats, 0);
  const totalFilled = summary.reduce((s, q) => s + q.filled, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Quota &amp; Seat Management</h1>
        <div className="flex gap-2">
          <input value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2.5 py-2" placeholder="Class e.g. Class 5" />
          <button onClick={() => setConfigOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <Plus size={15} /> Configure Quota
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title={`${classFilter} (Session ${import.meta.env.VITE_CURRENT_FY || '2026-27'})`} className="lg:col-span-2">
          {isLoading ? (
            <LoadingBlock />
          ) : summary.length === 0 ? (
            <EmptyState label="No quota configured for this class yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-2 pr-3">Quota Category</th>
                    <th className="py-2 pr-3">Total Seats</th>
                    <th className="py-2 pr-3">Filled</th>
                    <th className="py-2 pr-3">Available</th>
                    <th className="py-2 pr-3">% Filled</th>
                    <th className="py-2 pr-3">Waitlist</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((q) => (
                    <tr key={q.category} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3 font-medium text-gray-700">{q.category} {q.statutoryPercent ? `(${q.statutoryPercent}%)` : ''}</td>
                      <td className="py-2.5 pr-3">{q.totalSeats}</td>
                      <td className="py-2.5 pr-3">{q.filled}</td>
                      <td className="py-2.5 pr-3">{q.available}</td>
                      <td className="py-2.5 pr-3">{q.percentFilled}%</td>
                      <td className="py-2.5 pr-3">{q.waitlistCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Total Seats">
          {summary.length > 0 && (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={summary} dataKey="totalSeats" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {summary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center -mt-2">
                <span className="text-2xl font-bold text-gray-800">{totalFilled}</span>
                <span className="text-gray-400"> / {totalSeats} filled</span>
              </p>
            </div>
          )}
        </Card>
      </div>

      <ConfigureQuotaModal
        open={configOpen}
        defaultClass={classFilter}
        onClose={() => setConfigOpen(false)}
        onDone={() => qc.invalidateQueries({ queryKey: ['quota-dashboard'] })}
      />
    </div>
  );
};

const ConfigureQuotaModal = ({ open, defaultClass, onClose, onDone }) => {
  const [form, setForm] = useState({ classApplied: defaultClass, category: 'General', totalSeats: 0, statutoryPercent: 0, eligibilityRule: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await quotaService.upsert(form);
      toast.success('Quota configured');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Configure Quota">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">Class</label>
          <input required value={form.classApplied} onChange={(e) => setForm({ ...form, classApplied: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-600 mb-1">Total Seats</label>
            <input type="number" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Statutory %</label>
            <input type="number" value={form.statutoryPercent} onChange={(e) => setForm({ ...form, statutoryPercent: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Eligibility Rule (e.g. income ceiling)</label>
          <textarea value={form.eligibilityRule} onChange={(e) => setForm({ ...form, eligibilityRule: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" rows={2} />
        </div>
        <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Saving...' : 'Save Quota'}
        </button>
      </form>
    </Modal>
  );
};

export default Quotas;
