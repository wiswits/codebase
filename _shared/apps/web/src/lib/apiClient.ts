
import { refreshAccessToken, clearStoredAuth, notifyActivity, getAccessToken } from "./authToken";

import { API_URL } from "./apiUrl";
import { recordBreadcrumb } from "./errorBuffer";

// The access token lives in memory only (Phase 1.4). No localStorage/cookie
// fallback — auth rides the in-memory Bearer + the httpOnly cookie (sent via
// credentials:'include'); on reload the token is restored from the refresh cookie.
export const getToken = (): string => getAccessToken() ?? "";

// Internal attachment URLs (e.g. worksheet homework links) are stored as
// token-less relative paths like /api/worksheets/:id/render?version=student.
// A plain <a> resolves those against the frontend origin and can't send an
// Authorization header, so rebuild them against the API host with the
// caller's token. External URLs pass through untouched.
// Canonical URL builder for uploaded assets (logos, book covers, submissions,
// content PDFs…). Stored paths look like `/uploads/branding/x.png`, but in
// production the API is reachable ONLY under the `/api` reverse-proxy prefix —
// nginx owns bare `/uploads` and 404s it. So `/uploads/*` must resolve to
// `<API_URL>/uploads/*` (= …/api/uploads/*, served by the API's static mount).
// Absolute / blob / data URLs pass through. THE one helper — never rebuild
// this logic per page (that duplication is how the logo 404 class was born).
export const fileUrl = (u?: string | null): string => {
  if (!u) return "";
  if (/^(https?:\/\/|blob:|data:)/i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;
  return `${API_URL.replace(/\/api$/, "")}${path}`;
};

// SAME-ORIGIN image URL for <img>. On a deployed *.wiswits.com host the app's
// own nginx proxies `/api/*` to the API, so `/api/uploads/*` is served from the
// APP's own origin — which sidesteps the ENTIRE cross-origin surface (CORP,
// CORS, CDN cross-origin caching) that breaks a plain cross-origin <img>.
// Falls back to the absolute cross-origin fileUrl() off-domain (e.g. local dev).
export const imgSrc = (u?: string | null): string => {
  if (!u) return "";
  if (/^(https?:\/\/|blob:|data:)/i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  if (path.startsWith("/uploads/") &&
      typeof window !== "undefined" && /(^|\.)wiswits\.com$/i.test(window.location.hostname)) {
    return `/api${path}`;               // same-origin: app.wiswits.com/api/uploads/...
  }
  return fileUrl(u);
};

export const resolveAttachmentUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const m = url.match(/^\/api\/(worksheets\/\d+\/render\S*)$/);
  if (!m) return url;
  // Phase 1.4: no token in the URL. SecureFileFrame fetches with the Authorization
  // header + credentials; a direct navigation rides the same-site httpOnly cookie.
  return `${API_URL}/${m[1]}`;
};

async function req(method: string, endpoint: string, body?: any, retried = false): Promise<any> {
  const token = getToken();
  if (!retried) notifyActivity();
  // Hard timeout so a hung/slow backend can NEVER leave a spinner forever — the
  // request aborts and rejects, letting callers' catch / fetchResilient retries fire.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let r: Response;
  try {
    r = await fetch(`${API_URL}/${endpoint.replace(/^\//, "")}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // multi-branch: the active branch the user selected (ignored server-side
        // unless the org actually has >1 branch + the user is a member).
        ...(typeof window !== "undefined" && localStorage.getItem("ww_active_school")
          ? { "x-active-school": localStorage.getItem("ww_active_school") as string } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "include",
      signal: ctrl.signal,
    });
  } catch (e: any) {
    const why = e?.name === "AbortError" ? "timed out after 15s" : "network error";
    try { recordBreadcrumb("api", `${method} ${endpoint} -> ${why}`); } catch {}
    if (e?.name === "AbortError") throw new Error("The server took too long to respond — please retry.");
    throw new Error("Network error — check your connection and retry.");
  } finally {
    clearTimeout(timer);
  }
  if (r.status === 401 && typeof window !== "undefined") {
    if (!retried) {
      const fresh = await refreshAccessToken();
      if (fresh) return req(method, endpoint, body, true);
    }
    clearStoredAuth();
    if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    throw new Error("Session expired");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === "error") {
    // Leave a breadcrumb so the Report an Issue widget can attach the call that
    // actually failed. In-memory only, and never allowed to change what the
    // caller sees — the original error is still what gets thrown.
    try { recordBreadcrumb("api", `${method} ${endpoint} -> ${r.status} ${j.message || ""}`.trim()); } catch {}
    throw new Error(j.message || `HTTP ${r.status}`);
  }
  return j;
}

// paginated() envelopes put `pagination` as a SIBLING of `data`, not inside it
// (see backend utils/response.js). Unwrapping to `r.data` alone silently drops
// it, which is why list pages relying on `.pagination.total` (parents, teachers,
// students) either showed 0 or fell back to `rows.length` (wrong on page >1).
// Re-attach it here — once, for every caller — instead of patching each page.
export const apiGet    = (e: string) => req("GET", e).then(r => {
  const d = r.data ?? r;
  if (r?.pagination && d && typeof d === "object") { try { (d as any).pagination = r.pagination; } catch {} }
  return d;
});
export const apiGetRaw = (e: string) => req("GET", e);
export const apiPost   = (e: string, b: any) => req("POST", e, b).then(r => r.data ?? r);
export const apiPut    = (e: string, b: any) => req("PUT", e, b).then(r => r.data ?? r);
export const apiPatch  = (e: string, b?: any) => req("PATCH", e, b).then(r => r.data ?? r);
export const apiDel    = (e: string) => req("DELETE", e).then(r => r.data ?? r);
export const apiDelWithBody = (e: string, b?: any) => req("DELETE", e, b).then(r => r.data ?? r);

export const api = {
  // ═══ INSTITUTES / BRANCHES (multi-branch) ═══
  schools: {
    list:       () => apiGet("schools"),
    mine:       () => apiGet("schools/mine"),
    rollup:     () => apiGet("schools/rollup"),
    create:     (b: any) => apiPost("schools", b),
    update:     (id: number, b: any) => apiPut(`schools/${id}`, b),
    deactivate: (id: number) => apiDel(`schools/${id}`),
    assignableUsers: () => apiGet("schools/assignable-users"),
    members:    (id: number) => apiGet(`schools/${id}/members`),
    addMember:  (id: number, user_id: number) => apiPost(`schools/${id}/members`, { user_id }),
    lockMember: (id: number, userId: number, is_locked: boolean) => apiPatch(`schools/${id}/members/${userId}`, { is_locked }),
    removeMember: (id: number, userId: number) => apiDel(`schools/${id}/members/${userId}`),
  },

  // ═══ PLAYBOOKS (in-app module guide, SUG-0082) ═══
  playbooks: {
    keys: () => apiGet("playbooks"),
    get:  (key: string) => apiGet(`playbooks/${key}`),
  },

  // ═══ STUDENTS ═══
  students: {
    // A class teacher's edit/delete is held for an admin — these are the queue.
    changeRequests: (status = "pending") => apiGet(`students/change-requests?status=${status}`),
    approveChange:  (id: number) => apiPost(`students/change-requests/${id}/approve`, {}),
    rejectChange:   (id: number, reason?: string) => apiPost(`students/change-requests/${id}/reject`, { reason }),
    list:       (p?: any) => apiGetRaw(`students?${new URLSearchParams(p || {}).toString()}`),
    get:        (id: number) => apiGet(`students/${id}`),
    stats:      () => apiGet("students/stats"),
    teacherMine: () => apiGet("students/teacher/mine"),
    create:     (b: any) => apiPost("students", b),
    update:     (id: number, b: any) => apiPut(`students/${id}`, b),
    archive:    (id: number) => apiDel(`students/${id}`),
    // The other half of archive — the ten-second Undo, and an admin
    // reinstating a child who left and came back.
    activate:   (id: number) => apiPost(`students/${id}/activate`, {}),
    bulkAction: (action: string, student_ids: number[], payload: any = {}) => apiPost("students/bulk-action", { action, student_ids, payload }),
    bulkImport: (students: any[], section_id?: number) => apiPost("students/bulk", { students, section_id }),
    // CSV import (the modal called these; they were missing → import hung forever)
    importValidate: (rows: any[]) => apiPost("students/import/validate", { rows }),
    importExecute: (rows: any[], section_id?: number) => apiPost("students/import/execute", { rows, section_id }),
    // student profile drawer tabs (were missing → 3 tabs spun forever)
    studentAttendance: (id: number, p: any = {}) => apiGet(`students/${id}/attendance?${new URLSearchParams(p).toString()}`),
    studentFees: (id: number) => apiGet(`students/${id}/fees`),
    academic: (id: number) => apiGet(`students/${id}/academic`),
  },

  // ═══ TEACHERS ═══
  teachers: {
    stats:          () => apiGet("teachers/stats"),
    me:             () => apiGet("teachers/me"),
    // A teacher filling in their OWN profile. The allowlist lives on the server.
    updateMe:       (b: any) => apiPut("teachers/me", b),
    // apiGet (NOT apiGetRaw): every other list in this client hands the caller
    // the unwrapped `data` object, so callers write `d.teachers`. This one was
    // the odd one out and returned the full `{status,message,data}` envelope —
    // so `d.teachers` was silently `undefined` and every teacher PICKER built
    // on it came up empty (class/section "Class Teacher" dropdowns, meetings,
    // global search). apiGet also re-attaches a sibling `pagination`, and the
    // teachers list nests pagination inside `data` anyway, so paging is
    // unaffected. Defensive callers reading `r.data?.teachers || r.teachers`
    // keep working via their fallback.
    list:           (p?: any) => apiGet(`teachers?${new URLSearchParams(p || {}).toString()}`),
    get:            (id: number, reveal=false) => apiGet(`teachers/${id}${reveal ? "?reveal=true" : ""}`),
    create:         (b: any) => apiPost("teachers", b),
    update:         (id: number, b: any) => apiPut(`teachers/${id}`, b),
    archive:        (id: number) => apiDel(`teachers/${id}`),
    // Put a teacher back. One endpoint for both the ten-second Undo and an
    // admin reactivating someone months later — "undo" and "reactivate" are the
    // same act, and a second path would drift from this one.
    activate:       (id: number) => apiPost(`teachers/${id}/activate`, {}),
    bulkAction:     (action: string, teacher_ids: number[], payload: any = {}) => apiPost("teachers/bulk-action", { action, teacher_ids, payload }),
    assignSubject:  (id: number, b: any) => apiPost(`teachers/${id}/subjects`, b),
    removeSubject:  (id: number, assignId: number) => apiDel(`teachers/${id}/subjects/${assignId}`),
    departments:    () => apiGet("teachers/meta/departments"),
    createDept:     (b: any) => apiPost("teachers/meta/departments", b),
    subjects:       () => apiGet("teachers/meta/subjects"),
    // The order a school teaches its subjects in — alphabetical is nobody's
    // timetable. Same contract as api.classes.reorder.
    reorderSubjects: (order: number[]) => apiPut("teachers/meta/subjects/reorder", { order }),
    createSubject:  (b: any) => apiPost("teachers/meta/subjects", b),
    updateSubject:  (id: number, b: any) => apiPut(`teachers/meta/subjects/${id}`, b),
    deleteSubject:  (id: number) => apiDel(`teachers/meta/subjects/${id}`),
  },

  // ═══ CLASSES ═══
  classes: {
    list:          (p?: any) => apiGet(`classes?${new URLSearchParams(p || {}).toString()}`),
    get:           (id: number) => apiGet(`classes/${id}`),
    create:        (b: any) => apiPost("classes", b),
    update:        (id: number, b: any) => apiPut(`classes/${id}`, b),
    archive:       (id: number) => apiDel(`classes/${id}`),
    // The archived corner of the Classes page: what a school has archived, and
    // for each one whether it can still be deleted for good (and if not, why).
    archived:      () => apiGet("classes/archived"),
    // The exact inverse of `archive`, and the only way back. Reuses the normal
    // update endpoint because putting a class back on the register is an
    // ordinary, reversible edit — unlike deleteForever, it needs no new surface.
    restore:       (id: number) => apiPut(`classes/${id}`, { status: "active" }),
    // PERMANENT. A separate call from `archive` on purpose — the API refuses
    // unless the class is already archived and nothing references it.
    deleteForever: (id: number) => apiDel(`classes/${id}/permanent`),
    getSections:   (classId: number) => apiGet(`classes/${classId}/sections`),
    createSection: (classId: number, b: any) => apiPost(`classes/${classId}/sections`, b),
    updateSection: (classId: number, sid: number, b: any) => apiPut(`classes/${classId}/sections/${sid}`, b),
    deleteSection: (classId: number, sid: number) => apiDel(`classes/${classId}/sections/${sid}`),
    sectionStudents: (classId: number, sid: number) => apiGet(`classes/${classId}/sections/${sid}/students`),
    // Who teaches this section — read, assign, unassign, from the class side.
    sectionTeachers: (classId: number, sid: number) => apiGet(`classes/${classId}/sections/${sid}/teachers`),
    assignTeacher:   (classId: number, sid: number, b: any) => apiPost(`classes/${classId}/sections/${sid}/teachers`, b),
    unassignTeacher: (classId: number, sid: number, aid: number) => apiDel(`classes/${classId}/sections/${sid}/teachers/${aid}`),
    allSections:   () => apiGet("classes/all-sections"),
    // The order the school reads its classes in — Nursery, LKG, UKG, Class 1…
    // `standard` is the grade, not a position (LKG had standard 2, colliding
    // with Class 2), so the arrangement is its own thing the school controls.
    reorder:       (order: number[]) => apiPut("classes/reorder", { order }),
  },

  // ═══ ACADEMIC YEARS ═══
  academicYears: {
    list:   () => apiGet("classes/academic-years"),
    create: (b: any) => apiPost("classes/academic-years", b),
    update: (id: number, b: any) => apiPut(`classes/academic-years/${id}`, b),
  },

  // ═══ SECTIONS ═══
  sections: {
    list: (cid?: number) => apiGet(`sections${cid ? `?class_id=${cid}` : ""}`),
  },

  // ═══ FEES ═══
  fees: {
    dashboard:       () => apiGet("fees/dashboard"),
    structures:      () => apiGet("fees/structures"),
    getStructure:    (id: number) => apiGet(`fees/structures/${id}`),
    createStructure: (b: any) => apiPost("fees/structures", b),
    updateStructure: (id: number, b: any) => apiPut(`fees/structures/${id}`, b),
    deleteStructure: (id: number) => apiDel(`fees/structures/${id}`),
    // What deleting this structure would actually do — who stops being charged,
    // and whose money is already on the books. Asked BEFORE the confirm dialog,
    // so the warning can name people instead of guessing.
    structureImpact: (id: number) => apiGet(`fees/structures/${id}/impact`),
    // The day's close: by mode, by collector, reversals beside it.
    daybook: (date?: string) => apiGet(`fees/reports/daybook${date ? `?date=${date}` : ''}`),
    // What was given away, what was undone, and whether the receipt book holds.
    auditReport: (p?: any) => apiGet(`fees/reports/audit?${new URLSearchParams(p || {}).toString()}`),
    // Putting a fee onto students, and the register of who owes what. Without
    // these the module dead-ends after "structure created": nothing can be
    // collected, no dashboard total is non-zero, and the parent portal reads
    // "No fee structures assigned yet" forever.
    assignStructure: (id: number, b: any) => apiPost(`fees/structures/${id}/assign`, b),
    assignments:      (p?: any) => apiGetRaw(`fees/assignments?${new URLSearchParams(p || {}).toString()}`),
    updateAssignment: (id: number, b: any) => apiPut(`fees/assignments/${id}`, b),
    unassign:         (id: number) => apiDel(`fees/assignments/${id}`),
    // A receipt entered by mistake, or money genuinely returned. Not a delete —
    // the row stays, marked, so the numbered sequence keeps its integrity and a
    // closed day's total does not change without a trace.
    reversePayment:   (id: number, b: any) => apiPost(`fees/payments/${id}/reverse`, b),
    // Students on the roll being charged NOTHING. The register can only list
    // students who HAVE a fee, so the ones nobody assigned are invisible in
    // exactly the place you would look for them.
    unassigned:       (p?: any) => apiGetRaw(`fees/unassigned?${new URLSearchParams(p || {}).toString()}`),
    // Reminders became possible only once a fee had a due date (migration 045).
    sendReminders:    (b: any) => apiPost("fees/reminders/send", b),
    getStudent:      (studentId: number) => apiGet(`fees/student/${studentId}`),
    collect:         (b: any) => apiPost("fees/collect", b),
    recentPayments:  (limit=10) => apiGet(`fees/payments/recent?limit=${limit}`),
    defaulters:      (p?: any) => apiGet(`fees/defaulters?${new URLSearchParams(p||{}).toString()}`),
    collectionReport:(p?: any) => apiGet(`fees/reports/collection?${new URLSearchParams(p||{}).toString()}`),
  },

  // ═══ TRANSPORT ═══
  transport: {
    stats:             () => apiGet("transport/stats"),
    myChildren:        () => apiGet("transport/my-children"),
    vehicles:          () => apiGet("transport/vehicles"),
    createVehicle:     (b: any) => apiPost("transport/vehicles", b),
    updateVehicle:     (id: number, b: any) => apiPut(`transport/vehicles/${id}`, b),
    deleteVehicle:     (id: number) => apiDel(`transport/vehicles/${id}`),
    routes:            () => apiGet("transport/routes"),
    getRoute:          (id: number) => apiGet(`transport/routes/${id}`),
    createRoute:       (b: any) => apiPost("transport/routes", b),
    updateRoute:       (id: number, b: any) => apiPut(`transport/routes/${id}`, b),
    deleteRoute:       (id: number) => apiDel(`transport/routes/${id}`),
    staff:             () => apiGet("transport/staff"),
    createStaff:       (b: any) => apiPost("transport/staff", b),
    updateStaff:       (id: number, b: any) => apiPut(`transport/staff/${id}`, b),
    deleteStaff:       (id: number) => apiDel(`transport/staff/${id}`),
    assignments:       (p?: any) => apiGet(`transport/assignments?${new URLSearchParams(p||{}).toString()}`),
    createAssignment:  (b: any) => apiPost("transport/assignments", b),
    removeAssignment:  (id: number) => apiDel(`transport/assignments/${id}`),
    unassignedStudents:(search="") => apiGet(`transport/unassigned-students?search=${encodeURIComponent(search)}`),
    // Live bus tracking (SUG-0077)
    drivableRoutes:    () => apiGet("transport/drivable-routes"),
    // WW-32: the school's OWN drivers (Transport → Staff) that have a login,
    // not every staff account in the school.
    assignableDrivers: () => apiGet("transport/assignable-drivers"),
    // Candidate logins to attach to a driver record — asked only in that form.
    staffLogins:       () => apiGet("transport/staff-logins"),
    assignRouteDriver: (id: number, driver_user_id: number | null) => apiPut(`transport/routes/${id}/driver`, { driver_user_id }),
    recordRoutePath:   (id: number, points: any[]) => apiPost(`transport/routes/${id}/record-path`, { points }),
    routeManifest:     (id: number) => apiGet(`transport/route-manifest/${id}`),
    myTrip:            () => apiGet("transport/trips/mine"),
    startTrip:         (b: any) => apiPost("transport/trips/start", b),
    pingTrip:          (id: number, b: any) => apiPost(`transport/trips/${id}/ping`, b),
    endTrip:           (id: number) => apiPost(`transport/trips/${id}/end`, {}),
    activeTrips:       () => apiGet("transport/trips/active"),
    myBus:             () => apiGet("transport/my-bus"),
  },

  // ═══ LIBRARY ═══
  library: {
    stats:           () => apiGet("library/stats"),
    books:           (p?: any) => apiGet(`library/books?${new URLSearchParams(p||{}).toString()}`),
    getBook:         (id: number) => apiGet(`library/books/${id}`),
    createBook:      (b: any) => apiPost("library/books", b),
    updateBook:      (id: number, b: any) => apiPut(`library/books/${id}`, b),
    deleteBook:      (id: number) => apiDel(`library/books/${id}`),
    categories:      () => apiGet("library/categories"),
    createCategory:  (b: any) => apiPost("library/categories", b),
    members:         (p?: any) => apiGet(`library/members?${new URLSearchParams(p||{}).toString()}`),
    memberByCard:    (card: string) => apiGet(`library/members/by-card/${encodeURIComponent(card)}`),
    issue:           (b: any) => apiPost("library/issue", b),
    returnBook:      (issueId: number, b: any = {}) => apiPost(`library/return/${issueId}`, b),
    issues:          (p?: any) => apiGet(`library/issues?${new URLSearchParams(p||{}).toString()}`),
  },

  // ═══ ATTENDANCE ═══
  attendance: {
    dashboard:       () => apiGet("attendance/dashboard"),
    today:           () => apiGet("attendance/today"),
    sessions:        (p?: any) => apiGet(`attendance/sessions?${new URLSearchParams(p||{}).toString()}`),
    getOrCreate:     (b: any) => apiPost("attendance/sessions/get-or-create", b),
    mark:            (b: any) => apiPost("attendance/mark", b),
    lockSession:     (id: number, locked: boolean) => apiPost(`attendance/sessions/${id}/lock`, { locked }),
    studentHistory:  (studentId: number, p?: any) => apiGet(`attendance/student/${studentId}?${new URLSearchParams(p||{}).toString()}`),
    defaulters:      (p?: any) => apiGet(`attendance/reports/defaulters?${new URLSearchParams(p||{}).toString()}`),
    classWise:       (p?: any) => apiGet(`attendance/reports/class-wise?${new URLSearchParams(p||{}).toString()}`),
    sectionTrend:    (sid: number, days = 7) => apiGet(`attendance/reports/section/${sid}/trend?days=${days}`),
    leaves:          (p?: any) => apiGet(`attendance/leaves?${new URLSearchParams(p||{}).toString()}`),
    createLeave:     (b: any) => apiPost("attendance/leaves", b),
    updateLeave:     (id: number, b: any) => apiPut(`attendance/leaves/${id}`, b),
    config:          () => apiGet("attendance/config"),
    updateConfig:    (b: any) => apiPut("attendance/config", b),
  },

  // ═══ ROLES ═══


  studentPortal: {
    dashboard:  ()           => apiGet('student-portal/dashboard'),
    attendance: (p?: any)    => apiGet(`student-portal/attendance?${new URLSearchParams(p||{}).toString()}`),
    myClass:    ()           => apiGet('student-portal/my-class'),
    fees:       ()           => apiGet('student-portal/fees'),
    quizzes:    ()           => apiGet('student-portal/quizzes'),
  },

  timetable: {
    config:       ()            => apiGet('timetable/config'),
    updateConfig: (b: any)      => apiPut('timetable/config', b),
    sections:     ()            => apiGet('timetable/sections'),
    resources:    ()            => apiGet('timetable/resources'),
    forSection:   (id: number)  => apiGet(`timetable/section/${id}`),
    forTeacher:   (id: number)  => apiGet(`timetable/teacher/${id}`),
    saveSlot:     (b: any)      => apiPut('timetable/slot', b),
    clearSlot:    (b: any)      => apiDelWithBody('timetable/slot', b),
    clashCheck:   (b: any)      => apiPost('timetable/clash-check', b),
    copy:         (b: any)      => apiPost('timetable/copy', b),
    clearSection: (id: number)  => apiDel(`timetable/section/${id}`),
    my:           ()            => apiGet('timetable/my'),
  },

  assignments: {
    studentMine:     () => apiGet('assignments/student/mine'),
    teacherMine:     () => apiGet('assignments/teacher/mine'),
    // The whole school's assignments. The server already scopes this correctly —
    // a teacher gets only their own, elevated staff get all — which is exactly
    // what an admin opening Assignments expects to see. `teacherMine` is the
    // teacher's personal list and filters on teacher_id = me, so an admin who
    // had never set an assignment saw "Nothing here yet" while Reports counted
    // three (WW-98).
    list:            () => apiGet('assignments'),
    teacherResources:() => apiGet('assignments/teacher/resources'),
    get:             (id: number) => apiGet(`assignments/${id}`),
    create:          (b: any) => apiPost('assignments', b),
    update:          (id: number, b: any) => apiPut(`assignments/${id}`, b),
    remove:          (id: number) => apiDel(`assignments/${id}`),
    submit:          (id: number, b: any) => apiPost(`assignments/${id}/submit`, b),
    // Submit with an uploaded file (multipart). Optional answer_text alongside.
    submitFile: async (id: number, file: File, answerText?: string) => {
      const fd = new FormData();
      fd.append('file', file);
      if (answerText) fd.append('answer_text', answerText);
      const r = await fetch(`${API_URL}/assignments/${id}/submit`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.status === 'error' || j?.success === false) throw new Error(j?.message || 'Upload failed');
      return j.data || j;
    },
    grade:           (id: number, studentId: number, b: any) => apiPut(`assignments/${id}/grade/${studentId}`, b),
  },

  assessments: {
    stats:       ()         => apiGet('assessments/stats'),
    list:        (p?: any)  => apiGet(`assessments?${new URLSearchParams(p||{}).toString()}`),
    get:         (id: number) => apiGet(`assessments/${id}`),
    create:      (b: any)   => apiPost('assessments', b),
    update:      (id: number, b: any) => apiPut(`assessments/${id}`, b),
    remove:      (id: number) => apiDel(`assessments/${id}`),
    marksGrid:   (examId: number, sectionId: number) => apiGet(`assessments/${examId}/marks/section/${sectionId}`),
    saveMarks:   (examId: number, entries: any[]) => apiPost(`assessments/${examId}/marks/bulk`, { entries }),
    results:     (examId: number, sectionId: number) => apiGet(`assessments/${examId}/results/section/${sectionId}`),
    myResults:   () => apiGet('assessments/my/results'),
    teacherExams: () => apiGet('assessments/teacher/my-exams'),
  },

  reportcards: {
    settings:       ()                              => apiGet('reportcards/settings'),
    saveSettings:   (b: any)                        => apiPut('reportcards/settings', b),
    generate:       (exam_id: number, student_id: number) => apiGet(`reportcards/generate?exam_id=${exam_id}&student_id=${student_id}`),
    bulk:           (exam_id: number, section_id: number) => apiGet(`reportcards/bulk/${exam_id}/section/${section_id}`),
    publish:        (b: any)                        => apiPost('reportcards/publish', b),
    publishes:      ()                              => apiGet('reportcards/publishes'),
    my:             ()                              => apiGet('reportcards/my'),
    parentChildren: ()                              => apiGet('reportcards/parent/my-children'),
  },

  home: {
    admin:   () => apiGet('home/admin'),
    teacher: () => apiGet('home/teacher'),
    student: () => apiGet('home/student'),
    parent:  () => apiGet('home/parent'),
    owner:   () => apiGet('home/owner'),
  },

  messages: {
    threads:        () => apiGet('messages/threads'),
    threadMessages: (id: number) => apiGet(`messages/threads/${id}`),
    send:           (b: any) => apiPost('messages', b),
    // Accepts either a bare search string (the original call, still used by
    // MessagesCenter) or the filter set the compose modal sends. Undefined and
    // empty values are dropped so the URL never carries `category=undefined`.
    recipients:     (params?: string | Record<string, any>) => {
      const p = typeof params === 'string' ? { q: params } : (params || {});
      const qs = new URLSearchParams(
        Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][]
      ).toString();
      return apiGet(`messages/recipients${qs ? `?${qs}` : ''}`);
    },
    unreadCount:    () => apiGet('messages/unread-count'),
  },

  notifications: {
    list:        (params?: any) => apiGet(`notifications?${new URLSearchParams(params||{}).toString()}`),
    unreadCount: () => apiGet('notifications/unread-count'),
    markRead:    (id: number) => apiPut(`notifications/${id}/read`, {}),
    markAllRead: () => apiPut('notifications/read-all', {}),
    remove:      (id: number) => apiDel(`notifications/${id}`),
    broadcast:   (b: any) => apiPost('notifications/broadcast', b),
  },

  content: {
    stats:              () => apiGet('content/stats'),
    list:               (params?: any) => apiGet(`content?${new URLSearchParams(params||{}).toString()}`),
    byId:               (id: number) => apiGet(`content/${id}`),
    teacherMine:        () => apiGet('content/teacher/mine'),
    studentLibrary:     () => apiGet('content/student/library'),
    parentProgress:     () => apiGet('content/parent/children-progress'),
    create:             (b: any) => apiPost('content/', b),
    update:             (id: number, b: any) => apiPut(`content/${id}`, b),
    remove:             (id: number) => apiDel(`content/${id}`),
    trackProgress:      (id: number, b: any) => apiPut(`content/${id}/progress`, b),
    // Upload a real file (PDF/DOC/PPT/image) → returns { url } (an auth-only
    // /api/content/file/… path the secure viewer fetches with the JWT).
    uploadFile: async (file: File) => {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`${API_URL}/content/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.message || 'Upload failed');
      return j.data || j;
    },
  },

  // F2 — dashboard widgets API (/api/v1/widgets/*, PLATFORM_STANDARDS §9).
  // Every widget answers: primary_metric · secondary_metric · action · drill_down · data
  widgets: {
    get: (path: string, params?: any) =>
      apiGet(`v1/widgets/${path}?${new URLSearchParams(params || {}).toString()}`),
    attendanceToday: (params?: any) =>
      apiGet(`v1/widgets/attendance/today?${new URLSearchParams(params || {}).toString()}`),
  },

  gallery: {
    listEvents:     (params?: any) => apiGet(`gallery/events?${new URLSearchParams(params||{}).toString()}`),
    createEvent:    (b: any) => apiPost('gallery/events', b),
    updateEvent:    (id: number, b: any) => apiPut(`gallery/events/${id}`, b),
    deleteEvent:    (id: number) => apiDel(`gallery/events/${id}`),
    listAlbums:     (params?: any) => apiGet(`gallery/albums?${new URLSearchParams(params||{}).toString()}`),
    albumDetail:    (id: number) => apiGet(`gallery/albums/${id}`),
    createAlbum:    (b: any) => apiPost('gallery/albums', b),
    deleteAlbum:    (id: number) => apiDel(`gallery/albums/${id}`),
    addPhotos:      (albumId: number, photos: any[]) => apiPost(`gallery/albums/${albumId}/photos`, { photos }),
    uploadPhotos:   async (albumId: number, files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('photos', f));
      const r = await fetch(`${API_URL}/gallery/albums/${albumId}/photos/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.message || 'Upload failed');
      return j.data ?? j;
    },
    deletePhoto:    (id: number) => apiDel(`gallery/photos/${id}`),
    featured:       () => apiGet('gallery/featured'),
  },

  // Event Management (ported from EduSuite via the intake pipeline).
  events: {
    list:         (params?: any) => apiGet(`events?${new URLSearchParams(params||{}).toString()}`),
    get:          (id: number) => apiGet(`events/${id}`),
    create:       (b: any) => apiPost('events', b),
    update:       (id: number, b: any) => apiPatch(`events/${id}`, b),
    setStatus:    (id: number, status: string) => apiPatch(`events/${id}/status`, { status }),
    // archive · bin · restore — one endpoint, three shelves (never a hard delete)
    setState:     (id: number, state: "active" | "archived" | "deleted") => apiPatch(`events/${id}/state`, { state }),
    rsvp:         (id: number, status: string) => apiPut(`events/${id}/rsvp`, { status }),
    rsvpSummary:  (id: number, params?: any) => apiGet(`events/${id}/rsvps?${new URLSearchParams(params||{}).toString()}`),
    getAlbum:     (id: number) => apiGet(`events/${id}/album`),
    createAlbum:  (id: number) => apiPost(`events/${id}/album`, {}),
    // Who is this event for (WW-8). The whole rule set is replaced in one call:
    // an audience is edited as a sentence, not rule by rule.
    audience:        (id: number) => apiGet(`events/${id}/audience`),
    setAudience:     (id: number, rules: any[]) => apiPut(`events/${id}/audience`, { rules }),
    previewAudience: (id: number, rules: any[]) => apiPost(`events/${id}/audience/preview`, { rules }),
    // Same answer for an event that does not exist yet, so a school sees who it
    // reaches while composing rather than after saving.
    previewDraftAudience: (rules: any[]) => apiPost(`events/audience/preview`, { rules }),
    // When to nudge people (LOOP 3). Offsets are minutes BEFORE the start, so
    // moving the event moves every reminder with it.
    reminders:    (id: number) => apiGet(`events/${id}/reminders`),
    setReminders: (id: number, reminders: any[]) => apiPut(`events/${id}/reminders`, { reminders }),
    resources:    (params?: any) => apiGet(`events/resources?${new URLSearchParams(params||{}).toString()}`),
    availability: (resourceId: number, params?: any) => apiGet(`events/resources/${resourceId}/availability?${new URLSearchParams(params||{}).toString()}`),
    bookResource: (eventId: number, b: any) => apiPost(`events/${eventId}/resources`, b),
    removeBooking:(eventId: number, bookingId: number) => apiDel(`events/${eventId}/resources/${bookingId}`),
  },

  // Houses, clubs, teams — groups of children an event can be addressed to.
  // They live in People because a group is a group of students, not a feature
  // of Events (§9: new surface goes into an existing module).
  groups: {
    list:       (p?: any) => apiGet(`groups?${new URLSearchParams(p || {}).toString()}`),
    create:     (b: any) => apiPost('groups', b),
    update:     (id: number, b: any) => apiPatch(`groups/${id}`, b),
    archive:    (id: number) => apiDel(`groups/${id}`),
    members:    (id: number) => apiGet(`groups/${id}/members`),
    setMembers: (id: number, studentIds: number[]) => apiPut(`groups/${id}/members`, { studentIds }),
  },

  // Subscribe the school's dates into the calendar app a family already uses
  // (LOOP 4). The token IS the credential, so it is only ever shown to its
  // owner and can be turned off.
  calendarFeed: {
    get:    () => apiGet('calendar/feed/me/subscription'),
    create: () => apiPost('calendar/feed/me/subscription', {}),
    revoke: () => apiDel('calendar/feed/me/subscription'),
  },

  // Visitor Management (ported from EduSuite via the intake pipeline).
  visitors: {
    list:      (params?: any) => apiGet(`visitors?${new URLSearchParams(params||{}).toString()}`),
    get:       (id: number) => apiGet(`visitors/${id}`),
    checkIn:   (b: any) => apiPost('visitors/check-in', b),
    checkOut:  (id: number) => apiPatch(`visitors/${id}/check-out`, {}),
    cancel:    (id: number) => apiPatch(`visitors/${id}/cancel`, {}),
    issuePass: (id: number, b?: any) => apiPost(`visitors/${id}/pass`, b || {}),
    getPass:   (id: number) => apiGet(`visitors/${id}/pass`),
  },

  // Admissions — the document checklist against an applicant, and the school's
  // admission-number series. Attached to the leads pipeline we already run.
  admissions: {
    documents:      (leadId: number) => apiGet(`admissions/leads/${leadId}/documents`),
    addDocument:    (leadId: number, b: any) => apiPost(`admissions/leads/${leadId}/documents`, b),
    updateDocument: (id: number, b: any) => apiPatch(`admissions/documents/${id}`, b),
    removeDocument: (id: number) => apiDel(`admissions/documents/${id}`),
    series:         () => apiGet('admissions/series'),
    setSeriesPrefix:(b: any) => apiPut('admissions/series', b),
  },

  // Alumni Directory (ported from EduSuite via the intake pipeline). Reads the
  // platform's own client_alumni_profiles, which the lifecycle module fills.
  alumni: {
    list:   (params?: any) => apiGet(`alumni?${new URLSearchParams(params||{}).toString()}`),
    get:    (id: number) => apiGet(`alumni/${id}`),
    update: (id: number, b: any) => apiPatch(`alumni/${id}`, b),
  },

  polish: {
    trackView:    (id: number) => apiPost(`polish/assignment/${id}/view`, {}),
    views:        (id: number) => apiGet(`polish/assignment/${id}/views`),
    feeAlert:     (studentId: number) => apiGet(`polish/fee-alert/${studentId}`),
    receipt:      (paymentId: number) => apiGet(`polish/receipt/${paymentId}`),
  },

  crm: {
    stages:         () => apiGet('crm/stages'),
    createStage:    (b: any) => apiPost('crm/stages', b),
    updateStage:    (id: number, b: any) => apiPut(`crm/stages/${id}`, b),
    checkDupes:     (b: any) => apiPost('crm/leads/check-duplicates', b),
    listLeads:      (p?: any) => apiGet(`crm/leads?${new URLSearchParams(p||{}).toString()}`),
    pipeline:       () => apiGet('crm/leads/pipeline'),
    myLeads:        () => apiGet('crm/leads/mine'),
    leadDetail:     (id: number) => apiGet(`crm/leads/${id}`),
    createLead:     (b: any) => apiPost('crm/leads', b),
    updateLead:     (id: number, b: any) => apiPut(`crm/leads/${id}`, b),
    deleteLead:     (id: number) => apiDel(`crm/leads/${id}`),
    addActivity:    (id: number, b: any) => apiPost(`crm/leads/${id}/activities`, b),
    scheduleDemo:   (id: number, b: any) => apiPost(`crm/leads/${id}/demos`, b),
    updateDemo:     (id: number, b: any) => apiPut(`crm/demos/${id}`, b),
    convertLead:    (id: number, b: any) => apiPost(`crm/leads/${id}/convert`, b),
    stats:          () => apiGet('crm/stats'),
  },

  payments: {
    config:         () => apiGet('payments/config'),
    saveConfig:     (b: any) => apiPut('payments/config', b),
    listOrders:     (p?: any) => apiGet(`payments/orders?${new URLSearchParams(p||{}).toString()}`),
    myOrders:       () => apiGet('payments/my-orders'),
    createOrder:    (b: any) => apiPost('payments/create-order', b),
    verify:         (b: any) => apiPost('payments/verify', b),
    mockComplete:   (internalId: number) => apiPost(`payments/mock-complete/${internalId}`, {}),
    refund:         (id: number, b: any) => apiPost(`payments/orders/${id}/refund`, b),
    upiIntent:      (b: any) => apiPost('payments/upi-intent', b),
    manualConfirm:  (id: number, b: any) => apiPost(`payments/orders/${id}/manual-confirm`, b),
    stats:          () => apiGet('payments/stats'),
  },

  whatsapp: {
    config:          () => apiGet('whatsapp/config'),
    saveConfig:      (b: any) => apiPut('whatsapp/config', b),
    templates:       () => apiGet('whatsapp/templates'),
    createTemplate:  (b: any) => apiPost('whatsapp/templates', b),
    updateTemplate:  (id: number, b: any) => apiPut(`whatsapp/templates/${id}`, b),
    deleteTemplate:  (id: number) => apiDel(`whatsapp/templates/${id}`),
    testSend:        (b: any) => apiPost('whatsapp/test-send', b),
    bulkSend:        (b: any) => apiPost('whatsapp/bulk-send', b),
    broadcastSection:(b: any) => apiPost('whatsapp/broadcast-section-parents', b),
    messages:        (p?: any) => apiGet(`whatsapp/messages?${new URLSearchParams(p||{}).toString()}`),
    stats:           () => apiGet('whatsapp/stats'),
    optOut:          (b: any) => apiPost('whatsapp/opt-out', b),
    optIn:           (b: any) => apiPost('whatsapp/opt-in', b),
  },

  qb: {
    stats:           () => apiGet('qb/stats'),
    tree:            () => apiGet('qb/tree'),
    subjects:        () => apiGet('qb/subjects'),
    createSubject:   (b: any) => apiPost('qb/subjects', b),
    chapters:        (subject_id?: number) => apiGet(`qb/chapters${subject_id?'?subject_id='+subject_id:''}`),
    createChapter:   (b: any) => apiPost('qb/chapters', b),
    topics:          (chapter_id?: number) => apiGet(`qb/topics${chapter_id?'?chapter_id='+chapter_id:''}`),
    createTopic:     (b: any) => apiPost('qb/topics', b),
    questions:       (p?: any) => apiGet(`qb/questions?${new URLSearchParams(p||{}).toString()}`),
    question:        (id: number) => apiGet(`qb/questions/${id}`),
    createQuestion:  (b: any) => apiPost('qb/questions', b),
    updateQuestion:  (id: number, b: any) => apiPut(`qb/questions/${id}`, b),
    deleteQuestion:  (id: number) => apiDel(`qb/questions/${id}`),
    bulkImport:      (b: any) => apiPost('qb/questions/bulk-import', b),
  },

  worksheets: {
    list:            () => apiGet('worksheets'),
    preview:         (b: any) => apiPost('worksheets/preview', b),
    swapQuestion:    (b: any) => apiPost('worksheets/swap-question', b),
    save:            (b: any) => apiPost('worksheets', b),
    detail:          (id: number) => apiGet(`worksheets/${id}`),
    renderUrl:       (id: number, version: 'student'|'teacher' = 'student') =>
      `${API_URL}/worksheets/${id}/render?version=${version}`,
    assignAsHomework:(id: number, b: any) => apiPost(`worksheets/${id}/assign-as-homework`, b),
    delete:          (id: number) => apiDel(`worksheets/${id}`),
    // Curated PDF library (SUG-0052)
    curatedList:     (p?: any) => apiGet(`worksheets/curated?${new URLSearchParams(p || {}).toString()}`),
    curatedDelete:   (id: number) => apiDel(`worksheets/curated/${id}`),
    curatedFileUrl:  (id: number) =>
      `${API_URL}/worksheets/curated/${id}/file`,
  },

  // ═══ RECOVERY / PERSONALISED LEARNING (SUG-0052) ═══
  recovery: {
    generate:        (b: any) => apiPost('recovery/worksheets/generate', b),
    replaceQuestion: (id: number, question_id: number) => apiPost(`recovery/worksheets/${id}/replace-question`, { question_id }),
    assign:          (id: number, student_id: number) => apiPost(`recovery/worksheets/${id}/assign`, { student_id }),
    studentAnalytics:(studentId: number) => apiGet(`recovery/analytics/student/${studentId}`),
    studentWorksheets:(studentId: number) => apiGet(`recovery/worksheets/student/${studentId}`),
    worksheetPdfUrl: (id: number) =>
      `${API_URL}/recovery/worksheets/${id}/pdf`,
  },
  contentDev: {
    master:    (p?: any) => apiGet(`content-dev/master?${new URLSearchParams(p||{}).toString()}`),
    masterOne: (id: number) => apiGet(`content-dev/master/${id}`),
    assign:    (id: number, b: any) => apiPost(`content-dev/master/${id}/assign`, b),
    mine:      () => apiGet(`content-dev/mine`),
    mySections: () => apiGet(`content-dev/my-sections`),
    create:    (b: any) => apiPost(`content-dev`, b),
    update:    (id: number, b: any) => apiPut(`content-dev/${id}`, b),
    submit:    (id: number) => apiPost(`content-dev/${id}/submit`, {}),
    publish:   (id: number) => apiPost(`content-dev/${id}/publish`, {}),
    returnToAuthor: (id: number) => apiPost(`content-dev/${id}/return`, {}),
    archive:   (id: number) => apiPost(`content-dev/${id}/archive`, {}),
    recall:    (id: number, reason: string) => apiPost(`content-dev/${id}/recall`, { reason }),
    // Content Team (Academics Team) management
    team:        () => apiGet(`content-dev/team`),
    addMember:   (b: any) => apiPost(`content-dev/team`, b),
    addScope:    (userId: number, b: any) => apiPost(`content-dev/team/${userId}/scope`, b),
    removeScope: (userId: number, scopeId: number) => apiDel(`content-dev/team/${userId}/scope/${scopeId}`),
    setActive:   (userId: number, is_active: boolean) => apiPost(`content-dev/team/${userId}/active`, { is_active }),
    // Dynamic content types (category → subtype)
    contentTypes: () => apiGet(`content-dev/content-types`),
    addType:      (b: any) => apiPost(`content-dev/content-types`, b),
    toggleType:   (id: number, is_active: boolean) => apiPost(`content-dev/content-types/${id}/toggle`, { is_active }),
  },
  resources: {
    list:   (p?: any) => apiGet(`resources?${new URLSearchParams(p||{}).toString()}`),
    update: (id: number, b: any) => apiPut(`resources/${id}`, b),
    remove: (id: number) => apiDel(`resources/${id}`),
  },
  parents: {
    stats:           ()          => apiGet('parents/stats'),
    list:            (p?: any)   => apiGet(`parents?${new URLSearchParams(p||{}).toString()}`),
    get:             (id: number)=> apiGet(`parents/${id}`),
    create:          (b: any)    => apiPost('parents', b),
    update:          (id: number, b: any) => apiPut(`parents/${id}`, b),
    remove:          (id: number)=> apiDel(`parents/${id}`),
    activate:        (id: number)=> apiPost(`parents/${id}/activate`, {}),
    linkChild:       (id: number, b: any) => apiPost(`parents/${id}/children`, b),
    unlinkChild:     (id: number, sid: number) => apiDel(`parents/${id}/children/${sid}`),
    meetings:        (p?: any)   => apiGet(`parents/meetings/all?${new URLSearchParams(p||{}).toString()}`),
    myMeetings:      ()          => apiGet(`parents/meetings/mine`),
    createMeeting:   (b: any)    => apiPost('parents/meetings', b),
    scheduleMeeting: (b: any)    => apiPost('parents/meetings/schedule', b),
    meetingStaff:    ()          => apiGet('parents/meetings/staff'),
    updateMeeting:   (id: number, b: any) => apiPut(`parents/meetings/${id}`, b),
    threads:         (uid?: number) => apiGet(`parents/messages/threads${uid?'?user_id='+uid:''}`),
    threadMessages:  (tid: number)  => apiGet(`parents/messages/threads/${tid}`),
    sendMessage:     (b: any)    => apiPost('parents/messages', b),
    myChildren:      ()          => apiGet('parents/me/children'),
    childClass:      (cid: number) => apiGet(`parents/me/children/${cid}/class`),
    portalDashboard: ()          => apiGet('parents/portal/dashboard'),
    portalAttendance:(sid: number, p?: any) => apiGet(`parents/portal/child/${sid}/attendance?${new URLSearchParams(p||{}).toString()}`),
    portalFees:      (sid: number)  => apiGet(`parents/portal/child/${sid}/fees`),
  },
  // ═══ CIE — Curriculum Intelligence Engine (ADR-013) ═══
  // Read-only in Phase 1 by design: the Atlas is authored as files under
  // curriculum/ and loaded by scripts/cie_load.js, so the approval gate is the
  // pull-request merge rather than a permission workflow. `publishTree` is the
  // one write, and it is a status flip that refuses when any node teaches no
  // concept.
  cie: {
    overview:   () => apiGet("cie/overview"),
    concepts:   (q?: Record<string, string>) => apiGet(`cie/concepts${q && Object.keys(q).length ? `?${new URLSearchParams(q)}` : ""}`),
    concept:    (code: string) => apiGet(`cie/concepts/${encodeURIComponent(code)}`),
    boards:     () => apiGet("cie/boards"),
    trees:      (board?: string) => apiGet(`cie/trees${board ? `?board=${encodeURIComponent(board)}` : ""}`),
    nodes:      (q: Record<string, string>) => apiGet(`cie/nodes?${new URLSearchParams(q)}`),
    node:       (code: string) => apiGet(`cie/nodes/${encodeURIComponent(code)}`),
    crossBoard: () => apiGet("cie/cross-board"),
    quality:    () => apiGet("cie/quality"),
    publishTree: (b: { board: string; session: string; class: number; subject: string }) => apiPost("cie/trees/publish", b),

    // ── Builder — org 1 only (platformOnly on the server, /api/cie/builder) ──
    // "concept" never appears in the UI: creating a topic creates its concept
    // server-side (ADR-014). sameAs is the one place the word surfaces, and even
    // there it is labelled "the same idea as".
    saveBoard:     (b: { board_key: string; name: string; kind?: string }) => apiPost("cie/builder/boards", b),
    createNode:    (b: Record<string, any>) => apiPost("cie/builder/nodes", b),
    updateNode:    (code: string, b: Record<string, any>) => apiPatch(`cie/builder/nodes/${encodeURIComponent(code)}`, b),
    removeNode:    (code: string) => apiDel(`cie/builder/nodes/${encodeURIComponent(code)}`),
    sameAs:        (code: string, concept_code: string) => apiPost(`cie/builder/nodes/${encodeURIComponent(code)}/same-as`, { concept_code }),
    searchIdeas:   (q: string, excludeNode?: string) =>
      apiGet(`cie/builder/concepts/search?q=${encodeURIComponent(q)}${excludeNode ? `&exclude_node=${encodeURIComponent(excludeNode)}` : ""}`),
    nodeContent:   (code: string) => apiGet(`cie/builder/content?node_code=${encodeURIComponent(code)}`),
    addContent:    (b: Record<string, any>) => apiPost("cie/builder/content", b),
    updateContent: (id: number, b: Record<string, any>) => apiPatch(`cie/builder/content/${id}`, b),
    removeContent: (id: number) => apiDel(`cie/builder/content/${id}`),

    // ── My Curriculum — every school role (RESOLVE v1) ──────────────────────
    mySubjects:    () => apiGet("cie/my-curriculum/subjects"),
    myCurriculum:  (classId: number, subjectId: number, opts?: { purpose?: string; sectionId?: number }) => {
      const q = new URLSearchParams({ class_id: String(classId), subject_id: String(subjectId) });
      if (opts?.purpose) q.set("purpose", opts.purpose);
      if (opts?.sectionId) q.set("section_id", String(opts.sectionId));
      return apiGet(`cie/my-curriculum?${q}`);
    },

    // One authored lesson, with the body class already set for this viewer's role
    // and the school's medium. Returns a STRING of HTML to put in a locked
    // `srcdoc` iframe — never into our own DOM.
    lesson:        (source: "master" | "school", id: number) =>
      apiGet(`cie/my-curriculum/lesson/${source}/${id}`),

    // ── The school's academic identity (056) ────────────────────────────────
    profile:       () => apiGet("cie/school/profile"),
    saveProfile:   (b: { board_key: string; medium: string; session?: string | null }) => apiPut("cie/school/profile", b),
    orgSubjects:   (classId: number) => apiGet(`cie/school/subjects?class_id=${classId}`),
    toggleSubject: (b: { class_id: number; subject_id: number; is_enabled: boolean }) => apiPost("cie/school/subjects", b),

    // ── Teacher assigns resolved content to a section ───────────────────────
    sections:      (classId: number) => apiGet(`cie/school/sections?class_id=${classId}`),
    assign:        (b: { section_id: number; node_code: string; items: { source: string; id: number }[]; due_date?: string | null; notify?: string; note?: string }) =>
      apiPost("cie/assignments", b),
    assignments:   (q: { section_id?: number; node_code?: string }) =>
      apiGet(`cie/assignments?${new URLSearchParams(Object.entries(q).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))}`),
    withdraw:      (id: number) => apiDel(`cie/assignments/${id}`),
    sectionProgress: (sectionId: number, nodeCode?: string) =>
      apiGet(`cie/assignments/progress?section_id=${sectionId}${nodeCode ? `&node_code=${encodeURIComponent(nodeCode)}` : ""}`),

    // ── Student path + progress ─────────────────────────────────────────────
    myPath:        () => apiGet("cie/learn/path"),
    myTopic:       (nodeCode: string) => apiGet(`cie/learn/topic/${encodeURIComponent(nodeCode)}`),
    saveProgress:  (b: { source: string; content_id: number; node_code?: string; status?: string; pct?: number; seconds?: number; score?: number }) =>
      apiPost("cie/learn/progress", b),

    // ── Parent view of a child ──────────────────────────────────────────────
    children:      () => apiGet("cie/learn/children"),
    childSummary:  (studentId: number) => apiGet(`cie/learn/children/${studentId}`),
  },
  institution: {
    blueprints:    () => apiGet("institution/blueprints"),
    saveBlueprint: (type: string, b: any) => apiPut(`institution/blueprints/${type}`, b),
    labels:        () => apiGet("institution/labels"),
    saveLabels:    (labels: Record<string, string>) => apiPut("institution/labels", { labels }),
  },
  roles: {
    stats:              () => apiGet("roles/stats"),
    permissions:        () => apiGet("roles/permissions"),
    featureCatalog:     () => apiGet("roles/feature-catalog"),
    list:               () => apiGet("roles"),
    get:                (id: number) => apiGet(`roles/${id}`),
    create:             (b: any) => apiPost("roles", b),
    update:             (id: number, b: any) => apiPut(`roles/${id}`, b),
    remove:             (id: number) => apiDel(`roles/${id}`),
    clone:              (id: number, name: string) => apiPost(`roles/${id}/clone`, { name }),
    assign:             (id: number, user_ids: number[]) => apiPost(`roles/${id}/assign`, { user_ids }),
    unassign:           (id: number, user_ids: number[]) => apiPost(`roles/${id}/unassign`, { user_ids }),
    searchUsers:        (search="", excludeRoleId?: number) => apiGet(`roles/assignable-users/search?search=${encodeURIComponent(search)}${excludeRoleId ? `&exclude_role_id=${excludeRoleId}` : ''}`),
  },

  // ═══ MISC ═══
  announcements: { list: () => apiGet("announcements") },
  dashboard:     { stats: () => apiGet("dashboard/stats") },
  features:      { my: (as?: string) => apiGet(as ? `features/my?as=${encodeURIComponent(as)}` : "features/my") },

  // ═══ HELPDESK (Report an Issue widget + triage inbox) ═══
  helpdesk: {
    config:   () => apiGet("helpdesk/config"),
    create:   (b: any) => apiPost("helpdesk/tickets", b),
    mine:     () => apiGet("helpdesk/my"),
    list:     (p?: Record<string, string>) => apiGet(`helpdesk/tickets?${new URLSearchParams(p || {}).toString()}`),
    get:      (id: number) => apiGet(`helpdesk/tickets/${id}`),
    reply:    (id: number, body: string, is_internal?: boolean) => apiPost(`helpdesk/tickets/${id}/reply`, { body, is_internal }),
    confirm:  (id: number, works: boolean, note?: string) => apiPost(`helpdesk/tickets/${id}/confirm`, { works, note }),
    withdraw: (id: number) => apiDel(`helpdesk/tickets/${id}`),
    // platform (WisWits org only — the API enforces it, not the UI)
    admin: {
      list:      (p?: Record<string, string>) => apiGet(`helpdesk/admin/tickets?${new URLSearchParams(p || {}).toString()}`),
      update:    (id: number, b: any) => apiPatch(`helpdesk/admin/tickets/${id}`, b),
      merge:     (id: number, into: number) => apiPost(`helpdesk/admin/tickets/${id}/merge`, { into }),
      orgs:      () => apiGet("helpdesk/admin/orgs"),
      // Headline numbers + the facet lists the filters are built from. Separate
      // from list() on purpose — these must not move when you filter.
      stats:     () => apiGet("helpdesk/admin/stats"),
      assignees: () => apiGet("helpdesk/admin/assignees"),
      assign:    (id: number, assignee_user_id: number | null) => apiPatch(`helpdesk/admin/tickets/${id}`, { assignee_user_id }),
      setWidget: (orgId: number, enabled: boolean) => apiPost(`helpdesk/admin/orgs/${orgId}/widget`, { enabled }),
      // Ideas — the suggestions list. Grouping is computed server-side on every
      // load (no AI, no per-idea cost); only decisions are stored.
      ideas:      () => apiGet("helpdesk/admin/ideas"),
      acceptIdea: (b: any) => apiPost("helpdesk/admin/ideas", b),
      updateIdea: (id: number, b: any) => apiPatch(`helpdesk/admin/ideas/${id}`, b),
      linkIdea:   (id: number, ticket_id: number) => apiPost(`helpdesk/admin/ideas/${id}/tickets`, { ticket_id }),
    },
  },

  // ═══ TEACHING MODE ═══
  teaching: {
    // "What am I responsible for?" — the ONE teacher scope (timetable ∪ subject
    // assignments ∪ class teacher), resolved server-side by teacherScope.js.
    // Any teacher-facing picker must be built from this, not from the school's
    // full class list (WW-64).
    myClasses:      () => apiGet("teaching/my-classes"),
    myStudents:     () => apiGet("teaching/my-students"),
    sessions:       (p?: any) => apiGet(`teaching/sessions?${new URLSearchParams(p || {}).toString()}`),
    getSession:     (id: number) => apiGet(`teaching/sessions/${id}`),
    createSession:  (b: any) => apiPost("teaching/sessions", b),
    startSession:   (id: number) => apiPost(`teaching/sessions/${id}/start`, {}),
    endSession:     (id: number) => apiPost(`teaching/sessions/${id}/end`, {}),
    sessionReport:  (id: number) => apiGet(`teaching/sessions/${id}/report`),
    saveCanvas:     (id: number, b: any) => apiPost(`teaching/sessions/${id}/canvas`, b),
    getCanvas:      (id: number) => apiGet(`teaching/sessions/${id}/canvas`),
    createQuiz:     (id: number, b: any) => apiPost(`teaching/sessions/${id}/quiz`, b),
    launchQuiz:     (qid: number) => apiPost(`teaching/quiz/${qid}/launch`, {}),
    quizStats:      (qid: number) => apiGet(`teaching/quiz/${qid}/stats`),
    createActivity: (id: number, b: any) => apiPost(`teaching/sessions/${id}/activity`, b),
    simulations:    (p?: any) => apiGet(`teaching/simulations?${new URLSearchParams(p || {}).toString()}`),
    addSimulation:  (b: any) => apiPost("teaching/simulations", b),
    decks:          (p?: any) => apiGet(`teaching/decks?${new URLSearchParams(p || {}).toString()}`),
    getDeck:        (id: number) => apiGet(`teaching/decks/${id}`),
    createDeck:     (b: any) => apiPost("teaching/decks", b),
    addSlide:       (id: number, b: any) => apiPost(`teaching/decks/${id}/slides`, b),
    updateSlide:    (id: number, b: any) => apiPut(`teaching/slides/${id}`, b),
    deleteSlide:    (id: number) => apiDel(`teaching/slides/${id}`),
  },


  // ═══ QUIZZES ═══
  quizzes: {
    list:       (p?: any) => apiGet(`quizzes?${new URLSearchParams(p || {}).toString()}`),
    available:  () => apiGet("quizzes/available"),
    get:        (id: number) => apiGet(`quizzes/${id}`),
    create:     (b: any) => apiPost("quizzes", b),
    update:     (id: number, b: any) => apiPut(`quizzes/${id}`, b),
    remove:     (id: number) => apiDel(`quizzes/${id}`),
    addQuestion:     (id: number, b: any) => apiPost(`quizzes/${id}/questions`, b),
    addQuestionsBulk:(id: number, b: any) => apiPost(`quizzes/${id}/questions/bulk`, b),
    removeQuestion:  (id: number, qid: number) => apiDel(`quizzes/${id}/questions/${qid}`),
    getConfig:  (id: number) => apiGet(`quizzes/${id}/config`),
    saveConfig: (id: number, b: any) => apiPut(`quizzes/${id}/config`, b),
    publish:    (id: number) => apiPost(`quizzes/${id}/publish`, {}),
    close:      (id: number) => apiPost(`quizzes/${id}/close`, {}),
    startAttempt:   (id: number) => apiPost(`quizzes/${id}/start`, {}),
    submitAttempt:  (id: number, b: any) => apiPost(`quizzes/${id}/submit`, b),
    saveAnswer: (attemptId: number, b: any) => apiPut(`quizzes/attempts/${attemptId}/answer`, b),
    review:     (id: number, attemptId: number) => apiGet(`quizzes/${id}/results/${attemptId}`),
    submissions:(id: number) => apiGet(`quizzes/${id}/submissions`),
    analytics:  (id: number) => apiGet(`quizzes/${id}/analytics`),
  },


  // ═══ SUPPORT ═══
  support: {
    enquiry: (b: any) => apiPost('support/enquiry', b),
  },

  // ═══ DIGITAL DIARY ═══
  diary: {
    mine:    (p?: any) => apiGet(`diary/mine?${new URLSearchParams(p || {}).toString()}`),
    create:  (b: any) => apiPost('diary', b),
    remove:  (id: number) => apiDel(`diary/${id}`),
    student: () => apiGet('diary/student'),
  },

  // ═══ ADMIN ANALYTICS ═══
  adminReports: {
    overview:       () => apiGet("admin/reports/overview"),
    assignments:    (p?: any) => apiGet(`admin/reports/assignments?${new URLSearchParams(p || {}).toString()}`),
    quizzes:        () => apiGet("admin/reports/quizzes"),
    topPerformers:  () => apiGet("admin/reports/top-performers"),
    classCompare:   () => apiGet("admin/reports/class-comparison"),
    pendingGrading: () => apiGet("admin/reports/pending-grading"),
  },

  // ═══ CUSTOM FIELDS (T2.6) ═══ definitions CRUD; values flow through entity APIs
  fields: {
    list:    (entity: string, all = false) => apiGet(`fields/${entity}${all ? "?all=1" : ""}`),
    create:  (entity: string, b: any) => apiPost(`fields/${entity}`, b),
    update:  (entity: string, id: number, b: any) => apiPut(`fields/${entity}/${id}`, b),
    reorder: (entity: string, order: number[]) => apiPut(`fields/${entity}/reorder`, { order }),
    remove:  (entity: string, id: number, hard = false) => apiDel(`fields/${entity}/${id}${hard ? "?hard=1" : ""}`),
  },

  // ═══ FORM BUILDER (T2.6) ═══ named public forms for any entity + responses
  forms: {
    admissions:     () => apiGet("forms/admissions"),
    saveAdmissions: (b: any) => apiPut("forms/admissions", b),
    list:           () => apiGet("forms"),
    create:         (b: any) => apiPost("forms", b),
    update:         (id: number, b: any) => apiPut(`forms/${id}`, b),
    remove:         (id: number) => apiDel(`forms/${id}`),
    submissions:    (id: number) => apiGet(`forms/${id}/submissions`),
    // Deleting ONE response. Permanent by design — the responses table is the
    // original record a lead was created from, so a lead deleted from the CRM
    // can be restored from here, and this is the point past which nothing can.
    deleteSubmission: (formId: number, subId: number) => apiDel(`forms/${formId}/submissions/${subId}`),
  },

};
