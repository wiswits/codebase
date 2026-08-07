/* Blueprint manager — list, create, simulate and check coverage for
   reusable test structures (spec: blueprints drive auto-generated tests
   via POST /tests/from-blueprint, out of scope here).

   Live from:
   - GET   /blueprints                    → { blueprints: [...] }
   - POST  /blueprints                    → { id, name, status }
   - POST  /blueprints/:id/simulate       → { blueprint_id, total_questions, plan:[{wiswits_id,requested,available}] }
   - GET   /blueprints/:id/coverage       → { blueprint_id, coverage:[{chapter,needed,available,sufficient}] }

   chapter_weightage_json is a plain { [wiswits_id]: weight } map — the
   create form below builds it from 2-3 typed rows. */

import { useEffect, useState } from 'react';
import { Panel } from '../components/ui.jsx';

const HEADERS_JSON = { 'x-role': 'teacher', 'x-org-id': '9001', 'Content-Type': 'application/json' };
const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

const emptyWeightRow = () => ({ wiswits_id: '', weight: '' });

export default function BlueprintManager() {
  const [blueprints, setBlueprints] = useState(null);
  const [err, setErr] = useState(null);
  const [results, setResults] = useState({}); // id -> { simulate?, coverage?, err? }

  const [form, setForm] = useState({
    name: '', subject_id: 9001, class_no: 10,
    total_questions: 10, total_marks: 20, duration_min: 45,
  });
  const [weightRows, setWeightRows] = useState([emptyWeightRow(), emptyWeightRow(), emptyWeightRow()]);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);

  function load() {
    setErr(null);
    fetch('/api/pl/blueprints', { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((j) => setBlueprints(j.blueprints || []))
      .catch((e) => setErr(e?.error || e?.detail || 'failed to load'));
  }

  useEffect(load, []);

  function updateWeightRow(i, key, value) {
    setWeightRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateErr(null);
    if (!form.name.trim()) { setCreateErr('name is required'); return; }
    const chapter_weightage_json = {};
    for (const row of weightRows) {
      if (row.wiswits_id.trim() && row.weight !== '') {
        chapter_weightage_json[row.wiswits_id.trim()] = Number(row.weight);
      }
    }
    setCreating(true);
    try {
      const res = await fetch('/api/pl/blueprints', {
        method: 'POST',
        headers: HEADERS_JSON,
        body: JSON.stringify({ ...form, chapter_weightage_json }),
      });
      const j = await res.json();
      if (!res.ok) throw j;
      setForm({ name: '', subject_id: 9001, class_no: 10, total_questions: 10, total_marks: 20, duration_min: 45 });
      setWeightRows([emptyWeightRow(), emptyWeightRow(), emptyWeightRow()]);
      load();
    } catch (e) {
      setCreateErr(e?.error || e?.detail || 'failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function runSimulate(id) {
    setResults((r) => ({ ...r, [id]: { ...r[id], simulate: 'loading' } }));
    try {
      const res = await fetch(`/api/pl/blueprints/${id}/simulate`, { method: 'POST', headers: HEADERS_JSON, body: '{}' });
      const j = await res.json();
      if (!res.ok) throw j;
      setResults((r) => ({ ...r, [id]: { ...r[id], simulate: j } }));
    } catch (e) {
      setResults((r) => ({ ...r, [id]: { ...r[id], simulate: null, simulateErr: e?.error || 'failed' } }));
    }
  }

  async function runCoverage(id) {
    setResults((r) => ({ ...r, [id]: { ...r[id], coverage: 'loading' } }));
    try {
      const res = await fetch(`/api/pl/blueprints/${id}/coverage`, { headers: HEADERS });
      const j = await res.json();
      if (!res.ok) throw j;
      setResults((r) => ({ ...r, [id]: { ...r[id], coverage: j } }));
    } catch (e) {
      setResults((r) => ({ ...r, [id]: { ...r[id], coverage: null, coverageErr: e?.error || 'failed' } }));
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Blueprint Manager</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Reusable test structures — chapter weightage, question count, simulate before you build.</p>
      </div>

      <Panel title="＋ New Blueprint">
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <Field label="Name">
              <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Unit Test Ch1-5" />
            </Field>
            <Field label="Subject ID">
              <input style={inputStyle} type="number" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value) })} />
            </Field>
            <Field label="Class">
              <input style={inputStyle} type="number" value={form.class_no} onChange={(e) => setForm({ ...form, class_no: Number(e.target.value) })} />
            </Field>
            <Field label="Total questions">
              <input style={inputStyle} type="number" value={form.total_questions} onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) })} />
            </Field>
            <Field label="Total marks">
              <input style={inputStyle} type="number" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} />
            </Field>
            <Field label="Duration (min)">
              <input style={inputStyle} type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} />
            </Field>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Chapter weightage (wiswits_id → weight)
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {weightRows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
                  <input style={inputStyle} placeholder="MATH10C01T01" value={row.wiswits_id} onChange={(e) => updateWeightRow(i, 'wiswits_id', e.target.value)} />
                  <input style={inputStyle} type="number" placeholder="weight" value={row.weight} onChange={(e) => updateWeightRow(i, 'weight', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {createErr && <div style={{ color: 'var(--bad)', fontSize: 13 }}>⚠️ {String(createErr)}</div>}
          <div>
            <button type="submit" disabled={creating} style={btnStyle}>{creating ? 'Creating…' : 'Create Blueprint'}</button>
          </div>
        </form>
      </Panel>

      <Panel title="Blueprints">
        {err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(err)}</span>}
        {!err && blueprints == null && <span style={{ color: 'var(--text-faint)' }}>Loading…</span>}
        {!err && blueprints != null && blueprints.length === 0 && <span style={{ color: 'var(--text-faint)' }}>No blueprints yet — create one above.</span>}
        {!err && blueprints != null && blueprints.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {blueprints.map((b) => {
              const r = results[b.id] || {};
              return (
                <div key={b.id} style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                    Class {b.class_no} · Subject {b.subject_id} · {b.total_questions} Qs · {b.total_marks} marks · {b.duration_min}min
                    {b.is_locked ? ' · 🔒 locked' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button style={btnSmall} onClick={() => runSimulate(b.id)}>Simulate</button>
                    <button style={btnSmall} onClick={() => runCoverage(b.id)}>Coverage</button>
                  </div>

                  {r.simulate === 'loading' && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>Simulating…</div>}
                  {r.simulateErr && <div style={{ fontSize: 12, color: 'var(--bad)', marginTop: 8 }}>⚠️ {r.simulateErr}</div>}
                  {r.simulate && r.simulate !== 'loading' && (
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>Simulation ({r.simulate.total_questions} questions):</div>
                      {(r.simulate.plan || []).map((p) => (
                        <div key={p.wiswits_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>{p.wiswits_id}</span>
                          <span style={{ color: p.available < p.requested ? 'var(--bad)' : 'var(--good)' }}>{p.available}/{p.requested}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {r.coverage === 'loading' && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>Checking coverage…</div>}
                  {r.coverageErr && <div style={{ fontSize: 12, color: 'var(--bad)', marginTop: 8 }}>⚠️ {r.coverageErr}</div>}
                  {r.coverage && r.coverage !== 'loading' && (
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>Coverage:</div>
                      {(r.coverage.coverage || []).map((c) => (
                        <div key={c.chapter} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>{c.chapter}</span>
                          <span style={{ color: c.sufficient ? 'var(--good)' : 'var(--bad)' }}>
                            {c.available}/{c.needed} {c.sufficient ? '✅' : '🚨'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text)', padding: '8px 10px', fontSize: 13, width: '100%',
};

const btnStyle = {
  background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnSmall = {
  background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
};
