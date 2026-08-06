// api.js — fetch wrapper for the wellbeing API, per identity.
//
// ⚠️ DEV ONLY auth: the backend's stand-in gateway reads x-wb-* headers. In
//    production these come from the platform session, never the client. The
//    demo identities below let each role's screens talk to the API locally.

export const DEV_IDENTITIES = {
  student:    { actor_id: 7, role: 'student', org_id: 1 },
  teacher:    { actor_id: 5, role: 'teacher', org_id: 1 },
  counsellor: { actor_id: 9, role: 'counsellor', org_id: 1 },
  principal:  { actor_id: 3, role: 'principal', org_id: 1 },
};

function headersFor(identity) {
  return {
    'content-type': 'application/json',
    'x-wb-actor-id': String(identity.actor_id),
    'x-wb-role': identity.role,
    'x-wb-org-id': String(identity.org_id),
  };
}

function makeReq(identity) {
  return async function req(method, path, body) {
    const res = await fetch(`/api/wb${path}`, {
      method,
      headers: headersFor(identity),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return json;
  };
}

export function makeApi(identity) {
  const req = makeReq(identity);
  return {
    // student
    submitPulse: (p) => req('POST', '/pulse', p),
    myTrend: () => req('GET', '/pulse/my'),
    listJournal: () => req('GET', '/journal'),
    createJournal: (b) => req('POST', '/journal', b),
    readJournal: (id) => req('GET', `/journal/${id}`),
    shareJournal: (id) => req('POST', `/journal/${id}/share`),
    deleteJournal: (id) => req('DELETE', `/journal/${id}`),
    selfRaise: (p) => req('POST', '/flag/self-raise', p),
    listActivities: (q = '') => req('GET', `/activities${q}`),
    completeActivity: (id, p) => req('POST', `/activities/${id}/complete`, p),
    getConsent: () => req('GET', '/consent'),
    putConsent: (p) => req('PUT', '/consent', p),
    optOut: (p) => req('POST', '/consent/opt-out', p),
    // teacher
    classMood: (classId) => req('GET', `/class/${encodeURIComponent(classId)}/mood`),
    raiseConcern: (p) => req('POST', '/concern', p),
    myConcerns: () => req('GET', '/my/concerns'),
    // counsellor
    flags: () => req('GET', '/flags'),
    cases: (q = '') => req('GET', `/cases${q}`),
    getCase: (id) => req('GET', `/cases/${id}`),
    acknowledgeCase: (id) => req('POST', `/cases/${id}/acknowledge`),
    addNote: (id, p) => req('POST', `/cases/${id}/note`, p),
    closeCase: (id, p) => req('POST', `/cases/${id}/close`, p),
    refer: (id, p) => req('POST', `/cases/${id}/refer`, p),
    loopInParent: (id, p) => req('POST', `/cases/${id}/share-with-parent`, p),
    context: (studentId, reason) =>
      req('GET', `/students/${studentId}/context?reason=${encodeURIComponent(reason)}`),
    studentPulse: (studentId, reason) =>
      req('GET', `/students/${studentId}/pulse?reason=${encodeURIComponent(reason)}`),
    // public
    helplines: () => req('GET', '/helplines'),
  };
}

// Default student api (kept for the Week-7 screens).
export const api = makeApi(DEV_IDENTITIES.student);
