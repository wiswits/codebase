/* Offline response/event queue — spec 8.5: "network gaya to queue, wapas aaya
   to sync". Backed by localStorage so a reload (or airplane mode) never loses
   an answer. Flushed via POST /attempts/sync when connectivity returns. */

const key = (attemptId) => `pl_offline_queue_${attemptId}`;

function load(attemptId) {
  try {
    return JSON.parse(localStorage.getItem(key(attemptId)) || '{"responses":[],"events":[]}');
  } catch {
    return { responses: [], events: [] };
  }
}

function save(attemptId, q) {
  localStorage.setItem(key(attemptId), JSON.stringify(q));
}

export function enqueueResponse(attemptId, response) {
  const q = load(attemptId);
  q.responses.push({ ...response, _at: Date.now() });
  save(attemptId, q);
  return q;
}

export function enqueueEvent(attemptId, event) {
  const q = load(attemptId);
  q.events.push({ ...event, _at: Date.now() });
  save(attemptId, q);
  return q;
}

export function queueSize(attemptId) {
  const q = load(attemptId);
  return q.responses.length + q.events.length;
}

export async function flushQueue(attemptId, headers) {
  const q = load(attemptId);
  if (!q.responses.length && !q.events.length) return { flushed: 0 };
  const res = await fetch('/api/pl/attempts/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify({ attempt_id: attemptId, responses: q.responses, events: q.events }),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  save(attemptId, { responses: [], events: [] });
  return { flushed: q.responses.length + q.events.length };
}

export function clearQueue(attemptId) {
  localStorage.removeItem(key(attemptId));
}
