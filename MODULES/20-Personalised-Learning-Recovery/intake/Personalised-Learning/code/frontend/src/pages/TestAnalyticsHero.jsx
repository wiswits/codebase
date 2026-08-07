/* ⭐⭐ Test Analytics Hero — THE insight screen (spec 8.2).
   Header stats · score distribution · topic health · reteach alerts
   (misconceptions + clusters) · question quality flags.
   Fully live — every panel comes from GET /analytics/test/:id*.

   ⚠️ Backend quirks discovered while building this:
   - /analytics/test/:id/distribution bins use { range, count } (not
     { label, lo, hi } like the Histogram component's own doc comment
     implies) — we map range -> label here.
   - /analytics/test/:id/distractors insight.affected_students is an
     ARRAY of student_ids (dignity-safe: only used for .length here,
     never rendered as a list of names/ids).
   - On the seeded demo data (org 9001 / test 20), distractors, clusters
     and quality all come back empty — the panels below render an
     empty-state instead of assuming data will always be present. */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, StatCard, Bar, toneForAccuracy } from '../components/ui.jsx';
import Histogram from '../components/Histogram.jsx';

const DEFAULT_TEST_ID = 20;
const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

function useJson(url) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setErr(null);
    fetch(url, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setErr(e?.error || e?.detail || 'failed to load'); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, err };
}

export default function TestAnalyticsHero() {
  const params = useParams();
  const testId = Number(params.id) || DEFAULT_TEST_ID;
  const base = `/api/pl/analytics/test/${testId}`;

  const summary = useJson(`${base}`);
  const questions = useJson(`${base}/questions`);
  const distribution = useJson(`${base}/distribution`);
  const distractors = useJson(`${base}/distractors`);
  const clusters = useJson(`${base}/clusters`);
  const quality = useJson(`${base}/quality`);

  const s = summary.data;
  const bins = (distribution.data?.bins || []).map((b) => ({
    label: b.range,
    count: b.count,
  }));

  // group per-question accuracy by wiswits_id → topic health rows
  const topicRows = groupTopics(questions.data?.questions || []);

  const insights = distractors.data?.insights || [];
  const clusterList = clusters.data?.clusters || [];
  const flags = quality.data?.flags || [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Test Analytics · #{testId}</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>
          Class summary, distribution, topic health, reteach alerts &amp; question quality — all live from org 9001.
        </p>
      </div>

      {summary.err && (
        <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {String(summary.err)}</span></Panel>
      )}

      {!summary.err && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
          <StatCard value={s?.attempted_count ?? '—'} label="Attempted" />
          <StatCard value={s?.avg_score != null ? `${s.avg_score}%` : '—'} label="Average" tone="brand" />
          <StatCard value={s?.median_score != null ? `${s.median_score}%` : '—'} label="Median" />
          <StatCard value={s?.std_dev ?? '—'} label="Std dev" />
          <StatCard value={s?.topper_score != null ? `${s.topper_score}%` : '—'} label="Topper" tone="good" />
          <StatCard value={s?.lowest_score != null ? `${s.lowest_score}%` : '—'} label="Lowest" tone="bad" />
        </div>
      )}

      <Panel title="📊 Score Distribution">
        {distribution.err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(distribution.err)}</span>}
        {!distribution.err && (bins.length ? <Histogram bins={bins} /> : <Empty text="No evaluated attempts yet." />)}
      </Panel>

      <Panel title="🧩 Topic Health">
        {questions.err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(questions.err)}</span>}
        {!questions.err && (
          topicRows.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {topicRows.map((t) => (
                <div key={t.wiswits_id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t.wiswits_id}</span>
                  <Bar pct={t.avg_accuracy} tone={toneForAccuracy(t.avg_accuracy)} />
                  <span style={{ fontSize: 13, textAlign: 'right', color: 'var(--text-dim)' }}>{t.avg_accuracy}%</span>
                </div>
              ))}
            </div>
          ) : <Empty text="No question-level data yet." />
        )}
      </Panel>

      <Panel title="🚨 Reteach Alerts">
        {distractors.err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(distractors.err)}</span>}
        {!distractors.err && (
          insights.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {insights.map((ins) => (
                <div key={ins.question_id} style={{ padding: 12, background: 'var(--bad-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{ins.headline}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                    Q{ins.seq} · {ins.wiswits_id} · {ins.misconception?.explanation || ins.misconception?.reason || 'misconception'}
                    {ins.misconception?.pct != null && ` — ${ins.misconception.pct}% picked option ${ins.misconception.option}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                    {(ins.affected_students?.length ?? ins.misconception?.count ?? 0)} students affected
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty text="No reteach-worthy misconceptions detected for this test." />
        )}

        {clusterList.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              🔗 Misconception Cluster
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {clusterList.map((c) => (
                <div key={c.reason} style={{ padding: 10, background: 'var(--warn-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  {c.headline} · avg {c.avg_pct}% · questions {c.questions?.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="⚠️ Question Quality Flags">
        {quality.err && <span style={{ color: 'var(--bad)' }}>⚠️ {String(quality.err)}</span>}
        {!quality.err && (
          flags.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {flags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  <FlagBadge flag={f.flag} />
                  <span>Q{f.seq} · {f.wiswits_id} — {f.reason}</span>
                </div>
              ))}
            </div>
          ) : <Empty text="No quality issues flagged — all questions look sound." />
        )}
      </Panel>
    </div>
  );
}

function groupTopics(questions) {
  const byTopic = {};
  for (const q of questions) {
    const t = (byTopic[q.wiswits_id] ||= { wiswits_id: q.wiswits_id, sum: 0, n: 0 });
    t.sum += Number(q.accuracy) || 0;
    t.n += 1;
  }
  return Object.values(byTopic)
    .map((t) => ({ wiswits_id: t.wiswits_id, avg_accuracy: Math.round(t.sum / t.n) }))
    .sort((a, b) => a.avg_accuracy - b.avg_accuracy);
}

function FlagBadge({ flag }) {
  const tone = { key_error: 'bad', ambiguous: 'warn', non_discriminating: 'text-dim' }[flag] || 'text-dim';
  const label = { key_error: 'KEY ERROR', ambiguous: 'AMBIGUOUS', non_discriminating: 'NON-DISCRIMINATING' }[flag] || flag;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', background: `var(--${tone}-soft, var(--panel-2))`, color: `var(--${tone})` }}>
      {label}
    </span>
  );
}

function Empty({ text }) {
  return <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>{text}</div>;
}
