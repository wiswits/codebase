// tests/crisis.test.js — Week 3 (the crisis path)

const {
  detectCrisis, crisisMessage, escalationPlan, scanForCrisis, triggerCrisis, SEVERITY_BY_LEVEL,
} = require('../src/modules/wellbeing/wellbeing.crisis');
const { HELPLINES_INDIA, getHelplines } = require('../src/modules/wellbeing/wellbeing.helplines');

// Records every injected side-effect so we can assert the orchestration.
function spyDeps() {
  const calls = { events: [], flags: [], cases: [], alerts: [], escalations: [] };
  return {
    calls,
    createCrisisEvent: async (e) => { calls.events.push(e); return { id: 900, flag_id: null }; },
    createFlag:        async (f) => { calls.flags.push(f);  return { id: 500 }; },
    createCase:        async (c) => { calls.cases.push(c);  return { id: 700 }; },
    alertCounsellor:   async (a) => { calls.alerts.push(a); },
    scheduleEscalation:async (s) => { calls.escalations.push(s); },
    getLocalResources: async () => [],
  };
}

describe('🚨 detectCrisis — multilingual, tiered', () => {
  it('detects an immediate English phrase', () => {
    expect(detectCrisis('i want to die')).toMatchObject({ level: 'immediate' });
  });
  it('detects an immediate Hindi (Devanagari) phrase', () => {
    expect(detectCrisis('मुझे जीना नहीं चाहता अब')).toMatchObject({ level: 'immediate' });
  });
  it('detects an immediate Hinglish phrase', () => {
    expect(detectCrisis('mann karta hai khatam kar du sab')).toMatchObject({ level: 'immediate' });
  });
  it('detects urgent (self-harm) phrases', () => {
    expect(detectCrisis('i want to cut myself')).toMatchObject({ level: 'urgent' });
    expect(detectCrisis('khud ko nuksan')).toMatchObject({ level: 'urgent' });
  });
  it('detects concern-level phrases', () => {
    expect(detectCrisis('i feel so hopeless and alone')).toMatchObject({ level: 'concern' });
    expect(detectCrisis('bahut akela feel ho raha')).toMatchObject({ level: 'concern' });
  });
  it('prioritises immediate over lower tiers when both present', () => {
    expect(detectCrisis('i feel hopeless and i want to die')).toMatchObject({ level: 'immediate' });
  });
  it('is case-insensitive', () => {
    expect(detectCrisis('I WANT TO DIE')).toMatchObject({ level: 'immediate' });
  });
  it('returns null for ordinary text', () => {
    expect(detectCrisis('aaj maths ka test tha, thak gaya... wait')).not.toBeNull(); // "thak gaya" = concern
    expect(detectCrisis('aaj achha din tha')).toBeNull();
    expect(detectCrisis('')).toBeNull();
    expect(detectCrisis(null)).toBeNull();
  });
});

describe('⏱ escalationPlan — SLA and ladder', () => {
  const now = new Date('2026-07-16T10:00:00Z');

  it('immediate: 15-min SLA, all channels, escalate at 5 then 10 min', () => {
    const p = escalationPlan('immediate', now);
    expect(p.priority).toBe('crisis');
    expect(p.sla_due_at.getTime()).toBe(now.getTime() + 15 * 60_000);
    expect(p.alert.channels).toEqual(['push', 'sms', 'call', 'email']);
    expect(p.escalations).toEqual([
      { after_min: 5, to: 'principal' },
      { after_min: 10, to: 'platform_owner' },
    ]);
  });

  it('urgent: 2-hour SLA, push+sms, escalate to principal at 120 min', () => {
    const p = escalationPlan('urgent', now);
    expect(p.sla_due_at.getTime()).toBe(now.getTime() + 120 * 60_000);
    expect(p.escalations).toEqual([{ after_min: 120, to: 'principal' }]);
  });

  it('concern: 24-hour SLA, push only, no escalation', () => {
    const p = escalationPlan('concern', now);
    expect(p.sla_due_at.getTime()).toBe(now.getTime() + 24 * 60 * 60_000);
    expect(p.escalations).toEqual([]);
  });
});

describe('🔥 triggerCrisis orchestration', () => {
  const now = new Date('2026-07-16T10:00:00Z');

  it('immediate: logs event, raises red-100 flag, opens crisis case, alerts all channels, schedules 2 escalations', async () => {
    const deps = spyDeps();
    const out = await scanForCrisis(
      { org_id: 1, student_id: 42, text: 'i want to die', source: 'journal' }, deps, now
    );

    expect(deps.calls.events).toHaveLength(1);
    expect(deps.calls.flags[0]).toMatchObject({ severity: 'red', score: 100, primary_driver: 'crisis_keyword' });
    expect(deps.calls.cases[0]).toMatchObject({ priority: 'crisis' });
    expect(deps.calls.alerts[0].channels).toEqual(['push', 'sms', 'call', 'email']);
    expect(deps.calls.escalations).toHaveLength(2);

    expect(out.show_support_screen).toBe(true);
    expect(out.counsellor_notified).toBe(true);
    expect(out.helplines[0].name).toBe('Tele-MANAS'); // always present, priority 1
    expect(out.message.title).toBe('Ruko. Ek minute.');
  });

  it('⚠️ overrides consent and logs a reason (life-safety)', async () => {
    const deps = spyDeps();
    await scanForCrisis({ org_id: 1, student_id: 42, text: 'suicide', source: 'pulse_note' }, deps, now);
    const event = deps.calls.events[0];
    expect(event.consent_overridden).toBe(true);
    expect(event.override_reason).toMatch(/overrides consent/i);
    expect(event.severity).toBe(SEVERITY_BY_LEVEL.immediate); // 'emergency'
  });

  it('ordinary text triggers nothing', async () => {
    const deps = spyDeps();
    const out = await scanForCrisis({ org_id: 1, student_id: 42, text: 'aaj achha din tha', source: 'pulse_note' }, deps, now);
    expect(out).toBeNull();
    expect(deps.calls.events).toHaveLength(0);
    expect(deps.calls.alerts).toHaveLength(0);
  });
});

describe('📞 helpline registry', () => {
  it('Tele-MANAS is priority 1 and always first', async () => {
    const list = await getHelplines(1);
    expect(list[0].name).toBe('Tele-MANAS');
    expect(list[0].number).toBe('14416');
  });
  it('includes Childline 1098 for under-18s', () => {
    expect(HELPLINES_INDIA.some((h) => h.number === '1098')).toBe(true);
  });
  it('a school can append local resources, still priority-sorted', async () => {
    const list = await getHelplines(1, async () => [{ name: 'School Counsellor', number: '000', priority: 0 }]);
    expect(list[0].name).toBe('School Counsellor'); // priority 0 sorts first
  });
  it('every helpline is free and has hours', () => {
    for (const h of HELPLINES_INDIA) {
      expect(h.free).toBe(true);
      expect(h.hours).toBeTruthy();
    }
  });
});

describe('💬 crisisMessage', () => {
  it('immediate message reassures and offers breathing + helpline', () => {
    const m = crisisMessage('immediate');
    expect(m.show_helpline).toBe(true);
    expect(m.show_breathe).toBe(true);
    expect(m.body).toMatch(/tum akele nahi ho/i);
  });
  it('every level shows a helpline', () => {
    for (const lvl of ['immediate', 'urgent', 'concern']) {
      expect(crisisMessage(lvl).show_helpline).toBe(true);
    }
  });
});
