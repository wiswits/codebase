// wellbeing.crisis.js
//
// ⚠️⚠️⚠️ Ye code ka sabse important hissa hai. Ye kisi ki jaan bacha sakta hai.
//    This is the most important part of the code. It can save a life.
//    Keep it simple. Keep it fast. Keep it fail-safe.
//    Agar doubt ho — ZYADA respond karo, kam nahi. (When in doubt, respond MORE.)
//
// The crisis path bypasses scoring entirely. A keyword match is not weighed
// against anything — it triggers immediately.

const { CRISIS_KEYWORDS } = require('./wellbeing.crisis.keywords');
const { getHelplines } = require('./wellbeing.helplines');

// ─── time helpers (pure) ────────────────────────────────────────
const addMinutes = (d, m) => new Date(d.getTime() + m * 60_000);
const addHours = (d, h) => addMinutes(d, h * 60);

const SEVERITY_BY_LEVEL = Object.freeze({
  immediate: 'emergency',
  urgent: 'urgent',
  concern: 'concern',
});

// ─── the scanner ────────────────────────────────────────────────
// Returns { level, phrase } on the FIRST match (immediate → urgent → concern),
// or null. Substring + case-insensitive; false positives are acceptable, a
// miss is not. No regex — plain, auditable phrase matching.
function detectCrisis(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().trim();

  for (const level of ['immediate', 'urgent', 'concern']) {
    for (const phrase of CRISIS_KEYWORDS[level]) {
      if (lower.includes(phrase.toLowerCase())) {
        return { level, phrase };
      }
    }
  }
  return null;
}

// ─── the crisis message shown to the student (Part 4.4) ─────────
function crisisMessage(level) {
  if (level === 'immediate') {
    return {
      title: 'Ruko. Ek minute.',
      body:
        'Jo tumne likha, wo humne padha. Aur hum yahin hain.\n\n' +
        'Abhi is waqt tum akele nahi ho. School ki counsellor ko pata chal gaya hai, ' +
        'wo tumse baat karengi.\n\n' +
        'Agar abhi is waqt bahut mushkil lag raha hai, neeche wale number pe call karo. ' +
        'Koi 24 ghante hai. Bas sunne ke liye.\n\n' +
        'Tum zaroori ho. Ye baat sach hai, chahe abhi aisa na lage.',
      show_helpline: true,
      show_breathe: true,
      cta: 'Kisi se abhi baat karo',
    };
  }
  if (level === 'urgent') {
    return {
      title: 'Hum yahan hain',
      body:
        'Lagta hai kuch bahut bhaari chal raha hai.\n\n' +
        'School ki counsellor se baat kar lo? Wo sunengi, judge nahi karengi. ' +
        'Aur kisi ko nahi bataayengi bina tumse poochhe.\n\n' +
        'Ya abhi kisi se baat karni hai to neeche number hai.',
      show_helpline: true,
      cta: 'Counsellor se milna hai',
    };
  }
  return {
    title: 'Sab theek hai?',
    body: 'Agar kabhi baat karne ka mann ho, hum yahan hain.\nKoi jaldi nahi. Jab chaho.',
    show_helpline: true,
    cta: 'Baat karni hai',
  };
}

// ─── the escalation ladder (pure plan; caller schedules it) ─────
// Returns the SLA due-time and the sequence of escalations for a level.
function escalationPlan(level, now = new Date()) {
  if (level === 'immediate') {
    return {
      priority: 'crisis',
      sla_due_at: addMinutes(now, 15),
      alert: { channels: ['push', 'sms', 'call', 'email'], priority: 'CRISIS' },
      escalations: [
        { after_min: 5, to: 'principal' },        // counsellor silent 5 min → principal
        { after_min: 10, to: 'platform_owner' },  // principal silent 10 min → AK Sir + emergency
      ],
    };
  }
  if (level === 'urgent') {
    return {
      priority: 'urgent',
      sla_due_at: addHours(now, 2),
      alert: { channels: ['push', 'sms'], priority: 'URGENT' },
      escalations: [{ after_min: 120, to: 'principal' }],
    };
  }
  return {
    priority: 'routine',
    sla_due_at: addHours(now, 24),
    alert: { channels: ['push'], priority: 'HIGH' },
    escalations: [],
  };
}

// ─── the orchestrator ───────────────────────────────────────────
// All side-effects are injected via `deps` so the flow is unit-testable without
// a DB or a real alerting system. In production, server wiring supplies real
// implementations (DB writes, push/SMS/call gateways, escalation scheduler).
//
// ⚠️ CRISIS_OVERRIDES_CONSENT: a keyword match acts even if the student opted
//    out — life at risk overrides consent. It is logged with a reason.
async function triggerCrisis({ org_id, student_id, level, phrase, source, text }, deps, now = new Date()) {
  const {
    createCrisisEvent, createFlag, createCase, alertCounsellor,
    scheduleEscalation, getLocalResources,
  } = deps;

  const plan = escalationPlan(level, now);

  // 1. Log it (the trigger detail is encrypted by the caller's implementation).
  const event = await createCrisisEvent({
    org_id, student_id,
    trigger_source: 'keyword',
    trigger_detail: text,
    severity: SEVERITY_BY_LEVEL[level],
    matched_phrase: phrase,
    source,
    consent_overridden: true,
    override_reason: `Crisis keyword detected (${level}); life-safety overrides consent per policy.`,
  });

  // 2. Immediate red flag — bypasses scoring entirely.
  const flag = await createFlag({
    org_id, student_id, severity: 'red', score: 100,
    signals_json: [{ source: 'crisis_keyword', weight: 100, level }],
    primary_driver: 'crisis_keyword',
  });

  // 3. Highest-priority case with the SLA.
  const caseRow = await createCase({
    org_id, student_id, flag_id: flag?.id ?? event?.flag_id,
    priority: plan.priority,
    sla_due_at: plan.sla_due_at,
  });

  // 4. Alert (all channels for immediate) + schedule escalations.
  await alertCounsellor({ org_id, case_id: caseRow?.id, ...plan.alert });
  for (const step of plan.escalations) {
    await scheduleEscalation({ case_id: caseRow?.id, after_min: step.after_min, to: step.to });
  }

  // 5. The student sees support IMMEDIATELY. The screen is never empty.
  const helplines = await getHelplines(org_id, getLocalResources);
  return {
    show_support_screen: true,
    level,
    helplines,
    message: crisisMessage(level),
    counsellor_notified: true,
    case_id: caseRow?.id ?? null,
  };
}

// Convenience: scan text and, on a hit, run the full trigger.
async function scanForCrisis({ org_id, student_id, text, source }, deps, now = new Date()) {
  const hit = detectCrisis(text);
  if (!hit) return null;
  return triggerCrisis(
    { org_id, student_id, level: hit.level, phrase: hit.phrase, source, text },
    deps, now
  );
}

module.exports = {
  detectCrisis,
  crisisMessage,
  escalationPlan,
  triggerCrisis,
  scanForCrisis,
  SEVERITY_BY_LEVEL,
  addMinutes,
  addHours,
};
