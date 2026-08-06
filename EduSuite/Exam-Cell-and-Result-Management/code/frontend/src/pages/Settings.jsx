import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import { Save, Plus, Trash2, UserPlus, Pencil, Search, DatabaseBackup, ScrollText } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Table, Pagination } from '../components/ui/Table.jsx';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useSettings, useUpdateSettings } from '../hooks/useSettings.js';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers.js';
import { useAuditLogs } from '../hooks/useAuditLogs.js';
import { ROLE_LABELS } from '../constants/index.js';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'grading', label: 'Grading System' },
  { key: 'users', label: 'Users & Roles' },
  { key: 'audit', label: 'Audit Logs' },
  { key: 'backup', label: 'Backup' },
];

function GeneralTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (settings) {
      reset({
        institutionName: settings.institutionName,
        academicYear: settings.academicYear,
        timeZone: settings.timeZone,
        dateFormat: settings.dateFormat,
        currency: settings.currency,
        defaultLanguage: settings.defaultLanguage,
      });
    }
  }, [settings, reset]);

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  return (
    <form onSubmit={handleSubmit((data) => updateSettings.mutate(data))} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Institution Name</label>
          <input className="input-field" {...register('institutionName')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Academic Year</label>
          <input className="input-field" {...register('academicYear')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Time Zone</label>
          <input className="input-field" {...register('timeZone')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date Format</label>
          <select className="input-field" {...register('dateFormat')}>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            <option value="MM-DD-YYYY">MM-DD-YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Currency</label>
          <input className="input-field" {...register('currency')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Default Language</label>
          <input className="input-field" {...register('defaultLanguage')} />
        </div>
      </div>
      <button type="submit" disabled={updateSettings.isPending} className="btn-primary">
        <Save size={16} /> {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function GradingTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { register, control, handleSubmit, reset } = useForm({ defaultValues: { passingPercent: 33, showRank: true, gradingScale: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'gradingScale' });

  useEffect(() => {
    if (settings) reset({ passingPercent: settings.passingPercent, showRank: settings.showRank ?? true, gradingScale: settings.gradingScale || [] });
  }, [settings, reset]);

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  const onSubmit = (data) => {
    updateSettings.mutate({
      passingPercent: Number(data.passingPercent),
      showRank: !!data.showRank,
      gradingScale: data.gradingScale.map((g) => ({ grade: g.grade, minPercent: Number(g.minPercent), maxPercent: Number(g.maxPercent) })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Overall Passing Percentage</label>
        <input type="number" className="input-field w-40" {...register('passingPercent')} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" className="h-4 w-4 rounded accent-primary-500" {...register('showRank')} />
        <span className="text-sm text-slate-700">Show student rank on results and the student portal</span>
      </label>
      <p className="text-xs text-slate-400 -mt-3">
        Turning this off hides class rank everywhere but still computes it internally — useful if you'd
        rather students see their percentile without the added pressure of a rank number.
      </p>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Grading Scale</label>
          <button type="button" onClick={() => append({ grade: '', minPercent: 0, maxPercent: 0 })} className="btn-secondary text-xs py-1.5 px-3">
            <Plus size={13} /> Add Grade
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-8 gap-2 items-center">
              <input className="input-field col-span-2" placeholder="Grade" {...register(`gradingScale.${idx}.grade`)} />
              <input type="number" className="input-field col-span-2" placeholder="Min %" {...register(`gradingScale.${idx}.minPercent`)} />
              <input type="number" className="input-field col-span-2" placeholder="Max %" {...register(`gradingScale.${idx}.maxPercent`)} />
              <button type="button" onClick={() => remove(idx)} className="col-span-2 h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={updateSettings.isPending} className="btn-primary">
        <Save size={16} /> {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

const ROLE_COLOR = { admin: 'green', exam_controller: 'emerald', teacher: 'slate', invigilator: 'amber', principal: 'red', student: 'slate' };

function UsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data, isLoading } = useUsers({ page, limit: 8, search });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const openCreate = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'teacher', phone: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    reset({ name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, password: '' });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    if (editingUser) {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      await updateUser.mutateAsync({ id: editingUser._id, payload });
    } else {
      await createUser.mutateAsync(formData);
    }
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : data?.data?.length ? (
        <>
          <Table columns={['Name', 'Email', 'Role', 'Status', '']}>
            {data.data.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{u.name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{u.email}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Badge color={ROLE_COLOR[u.role] || 'slate'}>{ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Badge color={u.status === 'active' ? 'green' : 'red'} className="capitalize">{u.status}</Badge>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(u)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteUser.mutate(u._id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
        </>
      ) : (
        <p className="text-sm text-slate-400 text-center py-16">No users found.</p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
            <input className="input-field" {...register('name', { required: true })} />
            {errors.name && <p className="text-xs text-rose-500 mt-1">Name is required</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
            <input type="email" className="input-field" {...register('email', { required: true })} />
            {errors.email && <p className="text-xs text-rose-500 mt-1">Email is required</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Password {editingUser && <span className="text-slate-400 font-normal">(leave blank to keep unchanged)</span>}
            </label>
            <input type="password" className="input-field" {...register('password', { required: !editingUser })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role</label>
              <select className="input-field" {...register('role')}>
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
              <select className="input-field" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createUser.isPending || updateUser.isPending} className="btn-primary">
              {createUser.isPending || updateUser.isPending ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AuditLogsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs({ page, limit: 10 });

  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">A read-only trail of key actions taken across the system.</p>
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : data?.data?.length ? (
        <>
          <Table columns={['User', 'Role', 'Action', 'Module', 'Details', 'When']}>
            {data.data.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/60 transition">
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{log.user?.name || 'System'}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{ROLE_LABELS[log.user?.role] || '-'}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Badge color="slate" className="capitalize">{log.action.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{log.module}</td>
                <td className="px-3 py-2.5 max-w-xs truncate text-slate-500">{log.details}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-400 text-xs">{format(new Date(log.createdAt), 'dd MMM, HH:mm')}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pages={data.pagination.pages} onChange={setPage} />
        </>
      ) : (
        <div className="text-center py-16">
          <ScrollText size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No audit log entries yet. They'll appear here as actions are taken across ECRMS.</p>
        </div>
      )}
    </div>
  );
}

function BackupTab() {
  return (
    <Card className="p-8 flex flex-col items-center text-center max-w-lg">
      <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
        <DatabaseBackup size={24} className="text-primary-500" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">Backups run on your MongoDB instance</h3>
      <p className="text-sm text-slate-400">
        ECRMS stores all data in MongoDB. Use <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">mongodump</code> /{' '}
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">mongorestore</code>, or your hosting provider's automated
        snapshot feature (e.g. MongoDB Atlas backups), to schedule and restore backups.
      </p>
    </Card>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('general');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure institution details, grading, and user access" />

      <div className="flex gap-1 border-b border-slate-100 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.key ? 'border-primary-500 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        {tab === 'general' && <GeneralTab />}
        {tab === 'grading' && <GradingTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'audit' && <AuditLogsTab />}
        {tab === 'backup' && <BackupTab />}
      </Card>
    </div>
  );
}
