/* ⭐ Teacher Tests — list/manage view (spec: /teacher/pl/tests).
   Fetches GET /tests, filterable by status, links to create + detail. */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/ui.jsx';

const H = { 'x-role': 'teacher', 'x-org-id': '9001' };

const statusTone = { draft: 'text-dim', ready: 'brand', published: 'good', closed: 'text-faint', archived: 'text-faint' };

export default function TeacherTests() {
  const [tests, setTests] = useState(null);
  const [err, setErr] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/pl/tests', { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`tests → ${r.status}`))))
      .then((j) => setTests(j.tests || []))
      .catch((e) => setErr(e.message || 'failed to load tests'));
  }, []);

  const statuses = useMemo(() => {
    if (!tests) return [];
    return Array.from(new Set(tests.map((t) => t.status))).sort();
  }, [tests]);

  const visible = useMemo(() => {
    if (!tests) return [];
    return statusFilter === 'all' ? tests : tests.filter((t) => t.status === statusFilter);
  }, [tests, statusFilter]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Tests</h1>
          <p style={{ margin: 0, color: 'var(--text-dim)' }}>Create, publish, and manage tests for your class.</p>
        </div>
        <Link to="/teacher/pl/tests/create" style={btn}>+ New Test</Link>
      </div>

      <Panel
        title="All Tests"
        action={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={select}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      >
        {err && <p style={{ color: 'var(--bad)', fontSize: 13 }}>⚠️ {err}</p>}
        {!err && !tests && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Loading…</p>}
        {tests && visible.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No tests match this filter.</p>}
        {tests && visible.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Title', 'Type', 'Mode', 'Status', 'Questions', 'Created'].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => (
                  <tr key={t.id}>
                    <td style={td}>
                      <Link to={`/teacher/pl/tests/${t.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>{t.title}</Link>
                    </td>
                    <td style={td}>{t.type}</td>
                    <td style={td}>{t.mode}</td>
                    <td style={td}><StatusBadge status={t.status} /></td>
                    <td style={td}>{t.total_questions}</td>
                    <td style={{ ...td, color: 'var(--text-faint)' }}>{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = statusTone[status] || 'text-dim';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      textTransform: 'uppercase', letterSpacing: 0.4,
      background: tone === 'text-dim' || tone === 'text-faint' ? 'var(--panel-2)' : `var(--${tone}-soft)`,
      color: `var(--${tone})`,
    }}>
      {status}
    </span>
  );
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString();
}

const th = { textAlign: 'left', fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)' };
const td = { padding: '10px', borderTop: '1px solid var(--border)' };
const btn = { padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'none' };
const select = { background: 'var(--panel-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 13 };
