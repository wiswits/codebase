/* ⭐ Teacher Dashboard — the teacher's home screen for Personalized Learning.
   Pulls together reteach alerts, class health, students needing attention,
   pending evaluation, and a compact recovery-stats headline row. */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, StatCard, toneForAccuracy } from '../components/ui.jsx';

const H = { 'x-role': 'teacher', 'x-org-id': '9001' };

function useWidget(path) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pl/${path}`, { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${path} → ${r.status}`))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, [path]);
  return [data, err];
}

const severityTone = { critical: 'bad', escalated: 'bad', weak: 'warn', borderline: 'warn' };

export default function TeacherDashboard() {
  const [reteach, reteachErr] = useWidget('widgets/reteach-alerts');
  const [health, healthErr] = useWidget('widgets/class-health');
  const [attention, attentionErr] = useWidget('widgets/attention-needed');
  const [pending, pendingErr] = useWidget('widgets/pending-evaluation');
  const [recovery, recoveryErr] = useWidget('widgets/recovery-stats');

  const alerts = reteach?.preview ?? reteach?.alerts ?? [];
  const alertCount = reteach?.count ?? alerts.length ?? 0;

  const students = attention?.students ?? [];

  const h = recovery?.headline;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Teacher Dashboard · Personalized Learning</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Aaj ka snapshot — reteach alerts, class health, attention needed, pending work.</p>
      </div>

      <Panel
        title="🚨 Reteach Alerts"
        action={<Link to="/teacher/pl/insights" style={{ fontSize: 13, color: 'var(--brand)' }}>View all →</Link>}
      >
        {reteachErr && <ErrText msg={reteachErr} />}
        {!reteachErr && !reteach && <Loading />}
        {reteach && alertCount === 0 && <Empty text="No reteach alerts right now — nice." />}
        {reteach && alertCount > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--warn)', fontWeight: 600 }}>
              🚨 {alertCount} alert{alertCount === 1 ? '' : 's'} — students converging on the same wrong answer
            </div>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={a.id ?? i} style={{ padding: '10px 12px', background: 'var(--warn-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                {a.message || a.summary || `${a.wiswits_id ?? ''} · ${a.count ?? ''} students chose the same wrong answer`}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="📊 Class Health">
        {healthErr && <ErrText msg={healthErr} />}
        {!healthErr && !health && <Loading />}
        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <StatCard value={`${health.avg_accuracy ?? '—'}%`} label="Avg accuracy" tone={toneForAccuracy(health.avg_accuracy ?? 0)} />
            <StatCard value={health.weak_area_count ?? health.weak_count ?? '—'} label="Weak areas" tone="warn" />
            <StatCard value={health.students_escalated ?? health.critical_count ?? health.escalated_students ?? '—'} label="Escalated" tone="bad" />
          </div>
        )}
      </Panel>

      <Panel
        title="🧑‍🎓 Attention Needed"
        action={<Link to="/teacher/pl/weak-areas" style={{ fontSize: 13, color: 'var(--brand)' }}>View all ({attention?.count ?? '…'}) →</Link>}
      >
        {attentionErr && <ErrText msg={attentionErr} />}
        {!attentionErr && !attention && <Loading />}
        {attention && students.length === 0 && <Empty text="Nobody flagged right now." />}
        {attention && students.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {students.slice(0, 5).map((s) => (
              <div key={s.id ?? s.student_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{s.name} <span style={{ color: 'var(--text-faint)', fontFamily: 'var(--mono)', fontSize: 11 }}>· {s.wiswits_id}</span></span>
                <SeverityBadge severity={s.severity} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Panel title="📥 Pending Evaluation">
          {pendingErr && <ErrText msg={pendingErr} />}
          {!pendingErr && !pending && <Loading />}
          {pending && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
              <StatCard value={pending.pending_attempts ?? pending.submitted_not_evaluated ?? 0} label="Submitted, unevaluated" tone="brand" />
              <StatCard value={pending.offline_unmarked ?? 0} label="Offline unmarked" tone="warn" />
            </div>
          )}
        </Panel>

        <Panel title="🔄 Recovery Stats" action={<Link to="/teacher/pl/insights" style={{ fontSize: 13, color: 'var(--brand)' }}>Details →</Link>}>
          {recoveryErr && <ErrText msg={recoveryErr} />}
          {!recoveryErr && !recovery && <Loading />}
          {h && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
              <StatCard value={h.gaps_detected?.toLocaleString?.() ?? h.gaps_detected} label="Gaps found" />
              <StatCard value={h.gaps_closed?.toLocaleString?.() ?? h.gaps_closed} label="Closed" tone="good" />
              <StatCard value={`${h.close_rate}%`} label="Close rate" tone="good" />
              <StatCard value={`+${h.avg_gain}%`} label="Avg gain" tone="brand" />
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/teacher/pl/tests" style={linkBtn}>📝 Manage Tests</Link>
        <Link to="/teacher/pl/marks" style={linkBtn}>⌨️ Offline Marks Entry</Link>
        <Link to="/teacher/pl/root-cause" style={linkBtn}>🎯 Root Cause</Link>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const tone = severityTone[severity] || 'text-dim';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.4, background: `var(--${tone}-soft)`, color: `var(--${tone})` }}>
      {severity || 'flagged'}
    </span>
  );
}

function Loading() { return <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 13 }}>Loading…</p>; }
function Empty({ text }) { return <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 13 }}>{text}</p>; }
function ErrText({ msg }) { return <p style={{ margin: 0, color: 'var(--bad)', fontSize: 13 }}>⚠️ {msg}</p>; }

const linkBtn = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 13,
  fontWeight: 500,
};
