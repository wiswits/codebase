/* Student Result — route /student/pl/result/:id.
   Thin wrapper around ResultView for revisiting a past attempt result directly.
   GET /attempts/:id/result → same shape ResultView already renders
   (verified live: {attempt_id,status,score,max_score,percentage,correct_count,wrong_count,
    skipped_count,time_taken_sec,review:[...]}).
   NOTE: some older seeded attempts trip a backend bug in buildResult() (snap.options
   undefined) and 500/crash the endpoint — that's a backend issue, out of scope here;
   we just surface the error state. */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Panel } from '../components/ui.jsx';
import ResultView from './ResultView.jsx';

const HEADERS = { 'x-role': 'student', 'x-org-id': '9001' };

export default function StudentResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setResult(null);
    setErr(null);
    fetch(`/api/pl/attempts/${id}/result`, { headers: HEADERS })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j)).catch(() => Promise.reject({ error: `HTTP ${r.status}` }))))
      .then(setResult)
      .catch((e) => setErr(e?.detail || e?.error || 'failed to load result'));
  }, [id]);

  if (err) {
    return (
      <Panel>
        <span style={{ color: 'var(--bad)' }}>⚠️ {err}</span>
        <div style={{ marginTop: 12 }}>
          <Link to="/student/pl/tests" style={{ fontSize: 13 }}>← Back to tests</Link>
        </div>
      </Panel>
    );
  }

  if (!result) return <Panel>Loading result…</Panel>;

  return <ResultView result={result} onRestart={() => navigate('/student/pl/tests')} />;
}
