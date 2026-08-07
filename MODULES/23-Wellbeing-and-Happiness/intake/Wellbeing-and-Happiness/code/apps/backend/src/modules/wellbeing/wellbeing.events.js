// wellbeing.events.js
//
// ⚠️⚠️ CRITICAL BOUNDARY (Waada 1).
//    This module KISI academic/financial table ko DIRECTLY read nahi karta.
//    It NEVER reads an academic/financial table. Everything arrives as an event
//    whose payload is a SIGNAL, not data. We store { source, weight, note } —
//    never marks, never amounts, never a discipline record.
//
//    ✅ right:  on('pl.score_dropped', ({ org_id, student_id }) => addSignal({ source:'academic', weight:15, detail:{ note:'Recent performance change' }}))
//    ❌ wrong:  const marks = await db.query('SELECT * FROM client_exam_result ...')  // instant reject

const { WB_GUARDRAILS } = require('./wellbeing.guardrails');

// Pure mapper: (event, payload) → a signal to store, or null (not a signal).
// The mapper NEVER copies payload fields that could carry marks/amounts — it
// emits a fixed, human-readable note only.
function eventToSignal(event, payload = {}) {
  switch (event) {
    case 'attendance.absent_3day':
      return { source: 'attendance', weight: Math.min(25, WB_GUARDRAILS.ATTENDANCE_SIGNAL_MAX_WEIGHT),
               detail: { note: 'Several unexplained absences' } };
    case 'attendance.pattern_change':
      return { source: 'attendance_pattern_change', weight: 15, detail: { note: 'Attendance pattern changed' } };

    // ⚠️ Academic: capped at 15, NOTE ONLY. No marks are read or stored.
    case 'pl.score_dropped':
      return { source: 'academic', weight: Math.min(15, WB_GUARDRAILS.ACADEMIC_SIGNAL_MAX_WEIGHT),
               detail: { note: 'Recent performance change noted' } };

    case 'hostel.rollcall.absent':
      return { source: 'warden_concern', weight: 20, detail: { note: 'Missed hostel roll-call' } };
    case 'hostel.incident.critical':
      return { source: 'warden_concern', weight: 40, detail: { note: 'Critical hostel incident' } };
    case 'hostel.health.logged':
      return { source: 'social_withdrawal', weight: 10, detail: { note: 'Health logged at hostel' } };

    // Not signals — handled elsewhere.
    case 'exam.upcoming':
    case 'student.transferred':
      return null;

    default:
      return null;
  }
}

// A hard guard: reject any detail object that looks like it carries academic or
// financial data. Belt-and-suspenders against a future careless mapper edit.
const FORBIDDEN_DETAIL_KEYS = ['marks', 'score', 'percentage', 'grade', 'amount', 'fee',
  'fees', 'rank', 'result', 'exam_result'];
function assertDetailClean(detail = {}) {
  for (const k of Object.keys(detail)) {
    if (FORBIDDEN_DETAIL_KEYS.includes(k.toLowerCase())) {
      throw new Error(`Waada 1 violation: signal detail must not carry "${k}".`);
    }
  }
}

// Register subscribers on a platform event bus. `addSignal` persists a signal
// row (injected). `onProactive` handles non-signal events (exam prep, transfer).
function subscribeSignalEvents(bus, { addSignal, onExamUpcoming, onStudentTransferred } = {}) {
  const SIGNAL_EVENTS = [
    'attendance.absent_3day', 'attendance.pattern_change', 'pl.score_dropped',
    'hostel.rollcall.absent', 'hostel.incident.critical', 'hostel.health.logged',
  ];

  for (const ev of SIGNAL_EVENTS) {
    bus.on(ev, async (payload) => {
      const signal = eventToSignal(ev, payload);
      if (!signal) return;
      assertDetailClean(signal.detail);
      if (addSignal) {
        await addSignal({ org_id: payload.org_id, student_id: payload.student_id, ...signal });
      }
    });
  }

  bus.on('exam.upcoming', async (p) => { if (onExamUpcoming) await onExamUpcoming(p); });
  bus.on('student.transferred', async (p) => { if (onStudentTransferred) await onStudentTransferred(p); });

  return SIGNAL_EVENTS;
}

module.exports = { eventToSignal, assertDetailClean, subscribeSignalEvents, FORBIDDEN_DETAIL_KEYS };
