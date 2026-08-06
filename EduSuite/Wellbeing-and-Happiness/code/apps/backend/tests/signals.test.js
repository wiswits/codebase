// tests/signals.test.js — Week 5 (the signal engine)
// ⭐ Several marquee guardrails become real, tested code here.

const {
  scoreFromSignals, compute, SIGNAL_WEIGHTS, CAPS, THRESHOLDS,
} = require('../src/modules/wellbeing/wellbeing.signals');
const { computeSignals } = require('../src/modules/wellbeing/wellbeing.engine');
const { evaluateAndFlag, raiseSelf } = require('../src/modules/wellbeing/wellbeing.flags');
const { eventToSignal, assertDetailClean, subscribeSignalEvents } = require('../src/modules/wellbeing/wellbeing.events');

describe('⚠️⚠️ ACADEMIC + ATTENDANCE ALONE CAN NEVER PRODUCE RED', () => {
  it('attendance(25) + academic(15) = 40 → amber, never red', () => {
    const s = compute({ score_drop_20pct: true, attendance_absent_3: true });
    expect(s.total).toBeLessThan(THRESHOLDS.RED.min);
    expect(s.total).toBe(40);
    expect(s.severity).not.toBe('red');
    expect(s.severity).toBe('amber');
  });

  it('even piling on more behavioural signals stays capped at 40 (amber)', () => {
    const s = scoreFromSignals([
      { source: 'attendance_absent_3', weight: 25 },
      { source: 'attendance_absent_5', weight: 25 },
      { source: 'score_drop_20pct', weight: 15 },
      { source: 'score_drop_sustained', weight: 15 },
    ]);
    expect(s.breakdown.behavioural).toBe(CAPS.BEHAVIOURAL_MAX_COMBINED); // 40
    expect(s.severity).toBe('amber');
  });

  it('behavioural + weak that would sum ≥60 is still downgraded (academics alone never red)', () => {
    const s = scoreFromSignals([
      { source: 'attendance_absent_3', weight: 25 },
      { source: 'score_drop_20pct', weight: 15 },
      { source: 'social_withdrawal', weight: 10 },
      { source: 'activity_stopped', weight: 8 },
      { source: 'library_pattern_change', weight: 5 },
    ]);
    expect(s.total).toBeGreaterThanOrEqual(THRESHOLDS.RED.min); // caps: 40 + 20 = 60
    expect(s.severity).toBe('amber'); // nonBehavioural === 0 → downgrade
  });
});

describe('⭐ SELF-RAISE ALWAYS PRODUCES RED', () => {
  it('self-raise alone is red', () => {
    expect(compute({ self_raise: true }).severity).toBe('red');
  });

  it('self-raise stays red even amid otherwise-green context', () => {
    const s = scoreFromSignals([
      { source: 'self_raise', weight: 100 },
      { source: 'pulse_struggling_1day', weight: 15 },
    ]);
    expect(s.severity).toBe('red');
  });

  it('crisis keyword is always red too', () => {
    expect(compute({ crisis_keyword: true }).severity).toBe('red');
  });
});

describe('🎚 severity thresholds and drivers', () => {
  it('green below 30', () => {
    expect(scoreFromSignals([{ source: 'pulse_struggling_1day', weight: 15 }]).severity).toBe('green');
  });
  it('amber 30–59', () => {
    expect(scoreFromSignals([{ source: 'pulse_low_3days', weight: 30 }]).severity).toBe('amber');
  });
  it('red at 60+ when a real (non-behavioural) driver is present', () => {
    const s = scoreFromSignals([
      { source: 'teacher_concern', weight: 40 },
      { source: 'pulse_low_5days', weight: 45 },
    ]);
    expect(s.total).toBeGreaterThanOrEqual(60);
    expect(s.severity).toBe('red');
  });
  it('primary driver is the heaviest signal', () => {
    const s = scoreFromSignals([
      { source: 'pulse_low_3days', weight: 30 },
      { source: 'teacher_concern', weight: 40 },
    ]);
    expect(s.primary_driver).toBe('teacher_concern');
  });
  it('empty signals → green, no driver', () => {
    const s = scoreFromSignals([]);
    expect(s.severity).toBe('green');
    expect(s.primary_driver).toBeNull();
  });
});

describe('🧠 computeSignals — consent gate + gathering', () => {
  const sources = (overrides = {}) => ({
    getConsent: async () => ({ participates: 1 }),
    getRecentSelfRaise: async () => null,
    getSharedJournalFlag: async () => null,
    getHumanConcerns: async () => [],
    getRecentPulses: async () => [],
    getStoredSignals: async () => [],
    ...overrides,
  });

  it('returns null for an opted-out student (invisible)', async () => {
    const s = await computeSignals({ org_id: 1, student_id: 7 },
      sources({ getConsent: async () => ({ participates: 0, opted_out_at: new Date() }) }));
    expect(s).toBeNull();
  });

  it('a 5-day low streak yields the pulse_low_5days signal', async () => {
    const day = (n) => new Date(Date.UTC(2026, 6, n)).toISOString().slice(0, 10);
    const pulses = [16, 15, 14, 13, 12].map((n) => ({ date: day(n), mood: 'low', energy_1_5: 2 }));
    const s = await computeSignals({ org_id: 1, student_id: 7 },
      sources({ getRecentPulses: async () => pulses }), new Date('2026-07-16T00:00:00Z'));
    expect(s.signals.some((x) => x.source === 'pulse_low_5days')).toBe(true);
  });

  it('stored academic signal cannot push to red on its own', async () => {
    const s = await computeSignals({ org_id: 1, student_id: 7 },
      sources({ getStoredSignals: async () => [
        { source: 'academic', weight: 15, detail: { note: 'perf change' } },
        { source: 'attendance', weight: 25, detail: { note: 'absences' } },
      ] }));
    expect(s.severity).toBe('amber');
  });
});

describe('🏳 flag service', () => {
  it('raiseSelf persists a red flag and emits wb.self_raised', async () => {
    const created = [];
    const emitted = [];
    const out = await raiseSelf(
      { org_id: 1, student_id: 7, urgency: 'soon' },
      { createFlag: async (f) => { created.push(f); return { id: 1 }; }, emit: (e, p) => emitted.push([e, p]) }
    );
    expect(created[0]).toMatchObject({ severity: 'red', primary_driver: 'self_raise' });
    expect(out.sla_hours).toBe(24);
    expect(emitted.map((x) => x[0])).toContain('wb.self_raised');
  });

  it('evaluateAndFlag creates no flag when green', async () => {
    const created = [];
    const out = await evaluateAndFlag(
      { org_id: 1, student_id: 7 },
      { getConsent: async () => ({ participates: 1 }), getRecentPulses: async () => [
        { date: '2026-07-16', mood: 'struggling' } ] }, // struggling_1day = 15 → green
      { createFlag: async (f) => { created.push(f); return { id: 9 }; } }
    );
    expect(out.flag).toBeNull();
    expect(created).toHaveLength(0);
  });

  it('red flag emits the restricted wb.flag_raised event', async () => {
    const emitted = [];
    await evaluateAndFlag(
      { org_id: 1, student_id: 7 },
      { getConsent: async () => ({ participates: 1 }),
        getHumanConcerns: async () => [{ source: 'teacher_concern', role: 'teacher' }],
        getRecentPulses: async () => Array(5).fill({ date: '2026-07-16', mood: 'low' }) },
      { createFlag: async () => ({ id: 1 }), emit: (e, p) => emitted.push([e, p]) }
    );
    expect(emitted.some((x) => x[0] === 'wb.flag_raised')).toBe(true);
  });
});

describe('📡 event subscribers — Waada 1 boundary (event only, no marks)', () => {
  it('pl.score_dropped maps to a capped academic signal with a NOTE, no marks', () => {
    const sig = eventToSignal('pl.score_dropped', { org_id: 1, student_id: 7, marks: 12, percentage: 34 });
    expect(sig.source).toBe('academic');
    expect(sig.weight).toBeLessThanOrEqual(15);
    expect(sig.detail).toEqual({ note: 'Recent performance change noted' });
    expect(JSON.stringify(sig.detail)).not.toMatch(/12|34|marks|percentage/);
  });

  it('attendance signal is capped at 25', () => {
    expect(eventToSignal('attendance.absent_3day', {}).weight).toBeLessThanOrEqual(25);
  });

  it('assertDetailClean rejects marks/fees leaking into a signal detail', () => {
    expect(() => assertDetailClean({ note: 'ok', marks: 40 })).toThrow(/Waada 1/);
    expect(() => assertDetailClean({ amount: 5000 })).toThrow(/Waada 1/);
    expect(() => assertDetailClean({ note: 'clean' })).not.toThrow();
  });

  it('subscribing wires signal events to addSignal with clean details', async () => {
    const bus = { handlers: {}, on(e, fn) { (this.handlers[e] ||= []).push(fn); },
                  async emit(e, p) { for (const fn of this.handlers[e] || []) await fn(p); } };
    const stored = [];
    subscribeSignalEvents(bus, { addSignal: async (s) => stored.push(s) });
    await bus.emit('pl.score_dropped', { org_id: 1, student_id: 7, marks: 5 });
    expect(stored).toHaveLength(1);
    expect(stored[0].source).toBe('academic');
    expect(JSON.stringify(stored[0].detail)).not.toMatch(/marks|5/);
  });

  it('exam.upcoming and student.transferred are NOT signals', () => {
    expect(eventToSignal('exam.upcoming', {})).toBeNull();
    expect(eventToSignal('student.transferred', {})).toBeNull();
  });
});
