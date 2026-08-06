// wellbeing.crisis.responder.js
//
// Binds the crisis orchestrator's injected side-effects to real implementations.
// DB writers are real (repo). Alerting + escalation scheduling are stubs that
// log and emit an event — ⚠️ REPLACE these with real push/SMS/call gateways and
// a durable scheduler before production (Week 3 delivery gate).

const repo = require('./wellbeing.repo');

// Very small in-process event emitter stand-in (the platform bus is injected in prod).
const listeners = [];
function emit(event, payload) {
  for (const l of listeners) { try { l(event, payload); } catch { /* ignore */ } }
}
function onEvent(fn) { listeners.push(fn); }

async function alertCounsellor({ org_id, case_id, channels, priority }) {
  // ⚠️ STUB. Real impl: push + sms + call + email via the notification service.
  console.warn(`[CRISIS ALERT] org=${org_id} case=${case_id} priority=${priority} channels=${channels?.join(',')}`);
  emit('wb.crisis_detected', { org_id, case_id, priority });
}

async function scheduleEscalation({ case_id, after_min, to }) {
  // ⚠️ STUB. Real impl: durable delayed job that re-checks response and escalates.
  console.warn(`[CRISIS ESCALATION] case=${case_id} → ${to} in ${after_min} min if unanswered`);
  emit('wb.sla_escalation_scheduled', { case_id, after_min, to });
}

// The deps bundle passed to scanForCrisis / triggerCrisis.
const crisisDeps = {
  createCrisisEvent: repo.createCrisisEvent,
  createFlag: repo.createFlag,
  createCase: repo.createCase,
  alertCounsellor,
  scheduleEscalation,
  getLocalResources: async () => [], // DB-backed local helplines land later
};

module.exports = { crisisDeps, onEvent, emit };
