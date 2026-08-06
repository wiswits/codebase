import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { authService, documentService } from '../services/domainServices';
import { Card, Badge, LoadingBlock } from '../components/common/UI';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'admission_officer', 'counselor', 'panelist'];

const Settings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [classApplied, setClassApplied] = useState('Class 5');
  const [checklistInput, setChecklistInput] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ['all-users'], queryFn: () => authService.users() });
  const { data: checklistData } = useQuery({
    queryKey: ['checklist', classApplied],
    queryFn: () => documentService.getChecklist(classApplied),
  });

  const users = usersData?.data?.users || [];

  const saveChecklist = async () => {
    const docs = checklistInput.split(',').map((d) => d.trim()).filter(Boolean);
    try {
      await documentService.setChecklist(classApplied, docs);
      toast.success('Checklist updated');
      qc.invalidateQueries({ queryKey: ['checklist'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-gray-800">Settings</h1>

      {user.role === 'admin' && (
        <Card
          title="Staff Users"
          action={
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800">
              <Plus size={15} /> Add User
            </button>
          }
        >
          {usersLoading ? (
            <LoadingBlock />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3">{u.name}</td>
                      <td className="py-2.5 pr-3">{u.email}</td>
                      <td className="py-2.5 pr-3"><Badge color="blue">{u.role}</Badge></td>
                      <td className="py-2.5 pr-3"><Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card title="Document Checklist Configuration (FR10)">
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <label className="text-sm text-gray-600">Class:</label>
          <input value={classApplied} onChange={(e) => setClassApplied(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          rows={3}
          placeholder="Comma-separated list of required documents"
          defaultValue={(checklistData?.data?.requiredDocs || []).join(', ')}
          onChange={(e) => setChecklistInput(e.target.value)}
        />
        <button onClick={saveChecklist} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Save Checklist
        </button>
      </Card>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['all-users'] })} />
    </div>
  );
};

const CreateUserModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'counselor', phone: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.register(form);
      toast.success('User created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Staff User">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </Modal>
  );
};

export default Settings;
