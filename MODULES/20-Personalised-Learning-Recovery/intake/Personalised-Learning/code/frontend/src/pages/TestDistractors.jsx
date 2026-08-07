/* Focused distractor / misconception drill-down for one test.
   Bigger version of the "Reteach Alerts" panel from TestAnalyticsHero,
   one Donut (answer distribution) per flagged question, plus the
   cross-question misconception clusters panel.

   Live from:
   - GET /analytics/test/:id/distractors → { insights: [...] }
   - GET /analytics/test/:id/clusters    → { clusters: [...] }

   insight shape (backend/src/algorithms/distractor.js):
   { question_id, wiswits_id, seq, accuracy, distribution: {A:n,B:n,...,skipped:n},
     misconception: { option, option_text, count, pct, reason, explanation, remediation_hint },
     strength, headline, affected_students: [student_id, ...] }
   affected_students is an array of ids — dignity-safe usage here is length-only. */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Panel } from '../components/ui.jsx';
import Donut from '../components/Donut.jsx';

const DEFAULT_TEST_ID = 20;
const HEADERS = { 'x-role': 'teacher', 'x-org-id': '9001' };

function distributionToDonutData(dist) {
  if (!dist) return [];
  return Object.entries(dist).map(([label, value]) => ({ label: label === 'skipped' ? 'Skipped' : `Option ${label}`, value }));
}

export default function TestDistractors() {
  const params = useParams();
  const testId = Number(params.id) || DEFAULT_TEST_ID;

  const [insights, setInsights] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setInsights(null);
    setClusters(null);
    setErr(null);
    const base = `/api/pl/analytics/test/${testId}`;
    Promise.all([
      fetch(`${base}/distractors`, { headers: HEADERS }).then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j)))),
      fetch(`${base}/clusters`, { headers: HEADERS }).then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j)))),
    ])
      .then(([d, c]) => {
        setInsights(d?.insights ?? []);
        setClusters(c?.clusters ?? []);
      })
      .catch((e) => setErr(e?.error || e?.detail || 'failed to load'));
  }, [testId]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Distractor Analysis · Test #{testId}</h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>
          Per-question answer distribution and the misconception behind each wrong-answer spike.
        </p>
      </div>

      {err && <Panel><span style={{ color: 'var(--bad)' }}>⚠️ {String(err)}</span></Panel>}

      {!err && insights == null && <Panel>Loading…</Panel>}

      {!err && insights != null && (
        insights.length === 0 ? (
          <Panel>
            <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
              No actionable misconceptions detected for this test — either accuracy is high across the board,
              or no single wrong option dominates enough to flag.
            </div>
          </Panel>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {insights.map((ins) => (
              <Panel key={ins.question_id} title={`Q${ins.seq} · ${ins.wiswits_id}`}>
                <Donut data={distributionToDonutData(ins.distribution)} />
                <div style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>{ins.headline}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  {ins.misconception?.explanation || 'No explanation recorded.'}
                  {ins.misconception?.remediation_hint && (
                    <div style={{ marginTop: 6, color: 'var(--brand)' }}>💡 {ins.misconception.remediation_hint}</div>
                  )}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-faint)' }}>
                  {ins.misconception?.count ?? ins.affected_students?.length ?? 0} students picked option {ins.misconception?.option}
                  {' '}({ins.misconception?.pct}%) · accuracy on this question: {Math.round(ins.accuracy)}%
                </div>
              </Panel>
            ))}
          </div>
        )
      )}

      {!err && clusters != null && clusters.length > 0 && (
        <Panel title="🔗 Misconception Clusters">
          <p style={{ marginTop: 0, color: 'var(--text-dim)', fontSize: 13 }}>
            Same underlying misconception recurring across 2+ questions — a systemic gap, not a one-off.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {clusters.map((c) => (
              <div key={c.reason} style={{ padding: 12, background: 'var(--warn-soft)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <div>{c.headline}</div>
                <div style={{ color: 'var(--text-faint)', marginTop: 4, fontSize: 12 }}>
                  {c.question_count} questions · avg {c.avg_pct}% · seqs {c.questions?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
