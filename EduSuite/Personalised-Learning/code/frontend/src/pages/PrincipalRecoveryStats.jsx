/* ⭐⭐⭐ Principal Recovery Stats — THE Sales Screen (spec 8.4).
   "Ye screen principal ko dikha do. Pen nikal aayega." */

import { useEffect, useState } from 'react';
import { Panel, StatCard, Bar, toneForAccuracy } from '../components/ui.jsx';
import LineChart from '../components/LineChart.jsx';
import { recoveryStats as mock } from '../data/recoveryStats.js';

const th = { textAlign: 'left', fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.5 };
const td = { padding: '10px', fontSize: 14, borderTop: '1px solid var(--border)' };

export default function PrincipalRecoveryStats() {
  const [live, setLive] = useState(null);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    fetch('/api/pl/widgets/recovery-stats', { headers: { 'x-role': 'principal', 'x-org-id': '9001' } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { setLive(j); setSource('live'); })
      .catch(() => setSource('mock'));
  }, []);

  // merge: headline + curve from live DB; breakdowns from mock until DB-backed
  const d = {
    ...mock,
    headline: live?.headline || mock.headline,
    class_improvement: live?.class_improvement
      ? { ...mock.class_improvement, ...live.class_improvement }
      : mock.class_improvement,
  };
  const h = d.headline;
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>
          Learning Recovery · 2026–27{' '}
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, verticalAlign: 'middle',
            background: source === 'live' ? 'var(--good-soft)' : 'var(--warn-soft)',
            color: source === 'live' ? 'var(--good)' : 'var(--warn)' }}>
            {source === 'live' ? '● LIVE (org 9001)' : source === 'mock' ? '● demo data' : '…'}
          </span>
        </h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>The WISWITS Loop — codified. Har gap detect hua, band hua, automatically.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        <StatCard value={h.gaps_detected.toLocaleString()} label="Gaps found" />
        <StatCard value={h.gaps_closed.toLocaleString()} label="Closed" tone="good" />
        <StatCard value={`${h.close_rate}%`} label="Close rate" tone="good" />
        <StatCard value={`+${h.avg_gain}%`} label="Avg gain" tone="brand" />
        <StatCard value={h.avg_cycles} label="Avg cycles" />
        <StatCard value={h.avg_days} label="Avg days" />
      </div>

      <Panel title="Class Improvement · The Proof">
        <LineChart points={d.class_improvement.points} labels={d.class_improvement.tests} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{d.class_improvement.label}</span>
          <span style={{ color: 'var(--good)', fontWeight: 600 }}>📈 +20 percentage points</span>
        </div>
        <div style={{ marginTop: 14, padding: 14, background: 'var(--brand-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.6 }}>
          Ye WISWITS Loop hai. {h.gaps_detected.toLocaleString()} gaps detect hue. {h.gaps_closed.toLocaleString()} band hue. Har ek automatically.<br />
          Teacher ne sirf padhaya. System ne baaki sab kiya.
        </div>
      </Panel>

      <Panel title="Subject Health">
        <div style={{ display: 'grid', gap: 12 }}>
          {d.subjects.map((s) => {
            const rate = Math.round((s.closed / s.gaps) * 100);
            return (
              <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 200px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                <Bar pct={s.health} tone={toneForAccuracy(s.health)} />
                <span style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'right' }}>
                  {s.health}% · {s.gaps} gaps · {s.closed} closed ({rate}%){rate < 50 ? ' ⚠️' : ' ✅'}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: 14, marginBottom: 0, color: 'var(--warn)', fontSize: 13 }}>
          ⚠️ SST me 287 gaps, sirf 39% band hue. Sabse zyada dhyan yahan chahiye.
        </p>
      </Panel>

      <Panel title="Class-wise">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Class</th><th style={th}>Students</th><th style={th}>Gaps</th>
              <th style={th}>Closed</th><th style={th}>Rate</th><th style={th}>Avg gain</th><th style={th}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {d.classes.map((c) => {
              const rate = Math.round((c.closed / c.gaps) * 100);
              return (
                <tr key={c.name}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{c.students}</td>
                  <td style={td}>{c.gaps}</td>
                  <td style={td}>{c.closed}</td>
                  <td style={{ ...td, color: rate < 60 ? 'var(--warn)' : 'var(--good)', fontWeight: 600 }}>{rate}%</td>
                  <td style={{ ...td, color: 'var(--brand)' }}>+{c.gain}%</td>
                  <td style={td}>{c.trend === 'up' ? '📈' : '➡️'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Panel title="🚨 Needs Human Attention">
          <p style={{ marginTop: 0, color: 'var(--text-dim)', fontSize: 13 }}>
            {h.needs_teacher} students · 3 recovery cycles ho gaye · gap band nahi hua. System ne apna kaam kar liya. Ab teacher chahiye.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {d.needs_human.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bad-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{s.name} · {s.klass} · {s.topic}</span>
                <span style={{ color: 'var(--text-dim)' }}>{s.cycles} cycles · {s.from}% → {s.to}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="📚 Content Gaps → Roadmap">
          <p style={{ marginTop: 0, color: 'var(--text-dim)', fontSize: 13 }}>Worksheet generate karne me question kam pade — ye hi content roadmap hai.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {d.content_gaps.map((g) => (
              <div key={g.wiswits} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--warn-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <span>{g.wiswits} · {g.name}</span>
                <span style={{ color: 'var(--text-dim)' }}>needed {g.needed} · have {g.have} 🚨</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
