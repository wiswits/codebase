"use client";
/**
 * Institutes / Branches under the organization (multi-branch, Phase 1).
 * The owner can add and manage the institutes (school / coaching / …) that run
 * under one account. Data scoping + the header branch switcher arrive in Phase 2.
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { Building2, Plus, Pencil, Power, Loader2, Star, Users, GraduationCap, IndianRupee, CalendarCheck, Lock, LockOpen, UserPlus, ShieldCheck, X, Trash2 } from "lucide-react";
import { ModulePage } from "@/components/module-kit/ModulePage";
import { formatPct } from "@/lib/pct";

const TYPES = [
  { v: "school", l: "School" }, { v: "coaching", l: "Coaching institute" },
  { v: "tuition", l: "Tuition centre" }, { v: "college", l: "College" },
];
const typeLabel = (t: string) => TYPES.find((x) => x.v === t)?.l || "School";
const inr = (n: number) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v}`;
};

export default function InstitutesPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [rollup, setRollup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [accessFor, setAccessFor] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.schools.list(); setSchools(d.schools || []); }
    catch { toast.error("Couldn't load institutes"); }
    finally { setLoading(false); }
    // group rollup is best-effort — never blocks the page
    api.schools.rollup().then(setRollup).catch(() => setRollup(null));
  }, []);
  useEffect(() => { load(); }, [load]);

  const deactivate = async (s: any) => {
    if (!(await confirmDialog({ title: `Deactivate "${s.name}"?`, description: "Its data is kept; it just won't be selectable.", confirmLabel: "Deactivate", danger: true }))) return;
    try { await api.schools.deactivate(s.id); toast.success("Deactivated"); load(); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <ModulePage
      title="Institutes"
      subtitle="Branches & institutes under your organization — one account for all."
      icon={Building2}
      actions={
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-navy)] text-white text-sm font-semibold hover:bg-[var(--surface-navy-selected)]">
          <Plus className="w-4 h-4" /> Add institute
        </button>
      }
    >
    <div className="space-y-5">
      {(rollup?.branches?.length > 1) && <GroupOverview r={rollup} />}

      {(!rollup || rollup?.branches?.length <= 1) && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs p-3">
          Add the branches your group runs. New students, classes, fees &amp; attendance are automatically tagged to the branch you&apos;re working in — use the branch switcher in the top bar to move between them. Add a second institute to unlock the group overview.
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[0,1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {schools.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#eef1f8] text-[var(--surface-navy)] flex items-center justify-center shrink-0">
                    {s.type === "coaching" || s.type === "college" ? <GraduationCap className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      {s.name}
                      {!!s.is_primary && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--surface-gold)]"><Star className="w-3 h-3" /> Primary</span>}
                      {s.status === "inactive" && <span className="text-[10px] font-bold text-gray-400">· inactive</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{typeLabel(s.type)}{s.code ? ` · ${s.code}` : ""}</div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.student_count ?? 0} students</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {s.member_count ?? 0} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(s); setModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  {!s.is_primary && <button onClick={() => deactivate(s)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600" title="Deactivate"><Power className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
              <button onClick={() => setAccessFor(s)}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-[12px] font-semibold text-[var(--surface-navy)] dark:text-gray-200 hover:border-[var(--surface-gold)] hover:bg-[#faf7ef] dark:hover:bg-gray-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Manage access
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && <InstituteModal school={editing} onClose={() => { setModal(false); setEditing(null); }} onSaved={() => { setModal(false); setEditing(null); load(); }} />}
      {accessFor && <BranchAccessModal branch={accessFor} onClose={() => { setAccessFor(null); load(); }} />}
    </div>
    </ModulePage>
  );
}

function GroupOverview({ r }: { r: any }) {
  const t = r.totals || {};
  const branches = r.branches || [];
  const kpi = (icon: any, label: string, value: string, sub?: string) => (
    <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">{icon}{label}</div>
      <div className="text-xl font-bold text-white mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>}
    </div>
  );
  return (
    <div className="on-dark rounded-2xl bg-[var(--surface-navy)] text-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--surface-gold)]">Group overview</div>
          <h2 className="text-lg font-bold">All {t.branches} institutes together</h2>
        </div>
        <div className="text-[11px] text-white/50">Live · attendance for today ({r.date})</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {kpi(<Users className="w-3.5 h-3.5" />, "Students", (t.students || 0).toLocaleString("en-IN"), `${t.teachers || 0} teachers · ${t.classes || 0} classes`)}
        {kpi(<IndianRupee className="w-3.5 h-3.5" />, "Collected", inr(t.fees_collected), `of ${inr(t.fees_assigned)} assigned`)}
        {kpi(<IndianRupee className="w-3.5 h-3.5" />, "Pending", inr(t.fees_pending), `${formatPct(t.collection_rate)} collection rate`)}
        {kpi(<Building2 className="w-3.5 h-3.5" />, "Institutes", String(t.branches || 0), "under one account")}
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full ww-fill text-sm min-w-[640px]">
            <thead>
              <tr className="bg-white/5 text-white/60 text-[11px] uppercase tracking-wide">
                <th className="text-left font-semibold px-3 py-2">Institute</th>
                <th className="text-right font-semibold px-3 py-2">Students</th>
                <th className="text-right font-semibold px-3 py-2">Classes</th>
                <th className="text-right font-semibold px-3 py-2">Teachers</th>
                <th className="text-right font-semibold px-3 py-2">Today</th>
                <th className="text-right font-semibold px-3 py-2">Collected</th>
                <th className="text-right font-semibold px-3 py-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b: any) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      {b.name}
                      {b.is_primary && <Star className="w-3 h-3 text-[var(--surface-gold)]" />}
                    </div>
                    <div className="text-[11px] text-white/40">{typeLabel(b.type)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{b.students}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{b.classes}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{b.teachers}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {b.attendance_pct == null
                      ? <span className="text-white/30">—</span>
                      : <span className="inline-flex items-center gap-1"><CalendarCheck className="w-3 h-3 text-emerald-300" />{formatPct(b.attendance_pct)}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-300">{inr(b.fees_collected)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-amber-200">{inr(b.fees_pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BranchAccessModal({ branch, onClose }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addId, setAddId] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, u] = await Promise.all([api.schools.members(branch.id), api.schools.assignableUsers()]);
      setMembers(m.members || []);
      setPool(u.users || []);
    } catch { toast.error("Couldn't load access"); }
    finally { setLoading(false); }
  }, [branch.id]);
  useEffect(() => { load(); }, [load]);

  const memberIds = new Set(members.map((m) => m.user_id));
  const addable = pool.filter((u) => !memberIds.has(u.id));

  const add = async () => {
    if (!addId) return;
    setBusy(-1);
    try { await api.schools.addMember(branch.id, Number(addId)); setAddId(""); await load(); toast.success("Access granted"); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(null); }
  };
  const toggleLock = async (m: any) => {
    setBusy(m.user_id);
    try {
      await api.schools.lockMember(branch.id, m.user_id, !m.is_locked);
      await load();
      toast.success(!m.is_locked ? `Bound to ${branch.name}` : "Unbound — can roam");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(null); }
  };
  const remove = async (m: any) => {
    if (!(await confirmDialog({ title: `Remove ${m.name || "this user"}'s access to ${branch.name}?`, description: "They will lose access to this branch; you can grant it again later.", confirmLabel: "Remove access", danger: true }))) return;
    setBusy(m.user_id);
    try { await api.schools.removeMember(branch.id, m.user_id); await load(); toast.success("Access removed"); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <Dialog open onClose={onClose} title={`Access · ${branch.name}`} size="md">
      <div className="space-y-4">
        <div className="rounded-xl bg-[#f0f4fb] dark:bg-gray-800 border border-[#dbe4f3] dark:border-gray-700 text-[var(--surface-navy)] dark:text-gray-300 text-xs p-3 flex gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[var(--surface-gold)]" />
          <span><b>Bound</b> staff see &amp; manage <b>only this institute</b> — they can&apos;t switch branches. <b>Roaming</b> staff (leadership) can move across all institutes.</span>
        </div>

        {/* Add staff */}
        <div className="flex gap-2">
          <select value={addId} onChange={(e) => setAddId(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Add staff to this institute…</option>
            {addable.map((u) => <option key={u.id} value={u.id}>{u.name || u.email} {u.base_role ? `· ${u.base_role}` : ""}</option>)}
          </select>
          <button onClick={add} disabled={!addId || busy === -1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-navy)] text-white text-sm font-semibold disabled:opacity-50">
            {busy === -1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
          </button>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 max-h-[46vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No staff assigned yet.</div>
          ) : members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                  {m.name || m.email}
                  {m.base_role === "owner" && <span className="text-[10px] font-bold text-[var(--surface-gold)]">OWNER</span>}
                </div>
                <div className="text-[11px] text-gray-400 truncate">{m.email}{m.base_role ? ` · ${m.base_role}` : ""}</div>
              </div>
              {m.is_locked
                ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-lg shrink-0"><Lock className="w-3 h-3" /> Bound</span>
                : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg shrink-0"><LockOpen className="w-3 h-3" /> Roaming</span>}
              <button onClick={() => toggleLock(m)} disabled={busy === m.user_id || m.base_role === "owner"}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[var(--surface-navy)] disabled:opacity-30 shrink-0"
                title={m.base_role === "owner" ? "Owner always roams" : m.is_locked ? "Unbind (let roam)" : "Bind to this institute"}>
                {busy === m.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : m.is_locked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(m)} disabled={busy === m.user_id || !!m.is_primary}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-600 disabled:opacity-30 shrink-0" title="Remove access">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-navy)] text-white">Done</button>
        </div>
      </div>
    </Dialog>
  );
}

function InstituteModal({ school, onClose, onSaved }: any) {
  const [f, setF] = useState<any>({
    name: school?.name || "", type: school?.type || "school", code: school?.code || "",
    address: school?.address || "", phone: school?.phone || "", email: school?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) { toast.error("Institute name is required"); return; }
    setSaving(true);
    try {
      if (school?.id) await api.schools.update(school.id, f);
      else await api.schools.create(f);
      toast.success(school?.id ? "Institute updated" : "Institute added");
      onSaved();
    } catch (e: any) { toast.error(e?.message || "Couldn't save"); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
  return (
    <Dialog open onClose={onClose} title={school ? "Edit institute" : "Add institute"} size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Institute name <span className="text-rose-500">*</span></label>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inp} placeholder="e.g. WisWits Public School — Branch 2" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Type</label>
            <select value={f.type} onChange={(e) => set("type", e.target.value)} className={inp}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Code</label>
            <input value={f.code} onChange={(e) => set("code", e.target.value)} className={inp} placeholder="BR2" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Address</label>
          <input value={f.address} onChange={(e) => set("address", e.target.value)} className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Phone</label>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Email</label>
            <input value={f.email} onChange={(e) => set("email", e.target.value)} className={inp} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-navy)] text-white disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {school ? "Update" : "Add institute"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
