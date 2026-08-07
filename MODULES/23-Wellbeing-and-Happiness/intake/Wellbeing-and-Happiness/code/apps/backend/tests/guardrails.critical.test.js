// tests/guardrails.critical.test.js
//
// ⚠️ These assert that the promises hold. If any of the "must throw" tests
//    stops throwing, a guardrail has been broken — stop and talk to AK Sir.
//
// Week 1 scope: the guardrail PRIMITIVES that exist today and run without a
// live MySQL — query linter, aggregate guard, role/reason gate, boot check.
// API- and DB-integration versions of these (PRD Part 1.3) land in later weeks
// and are listed as `it.todo` below so the gaps stay visible.

const {
  WB_GUARDRAILS,
  assertNoBannedJoin,
  assertAggregateSize,
  assertCanSeeIndividual,
} = require('../src/modules/wellbeing/wellbeing.guardrails');
const { GuardrailViolation, Forbidden, BadRequest } = require('../src/modules/wellbeing/wellbeing.errors');
const { verifyGuardrailsAtBoot } = require('../src/modules/wellbeing/wellbeing.boot');

describe('🚨 Query linter — banned joins MUST throw', () => {
  it('rejects wb_pulse JOIN client_exam_result (Waada 1: mood ≠ marks)', () => {
    expect(() => assertNoBannedJoin(
      `SELECT p.mood, e.marks FROM wb_pulse p
       JOIN client_exam_result e ON e.student_id = p.student_id`
    )).toThrow(GuardrailViolation);
  });

  it('rejects wb_flag JOIN client_fees', () => {
    expect(() => assertNoBannedJoin(
      `SELECT f.severity, fe.amount FROM wb_flag f
       JOIN client_fees fe ON fe.student_id = f.student_id`
    )).toThrow(GuardrailViolation);
  });

  it('rejects wb_signal JOIN client_discipline', () => {
    expect(() => assertNoBannedJoin(
      `SELECT s.* FROM wb_signal s JOIN client_discipline d ON d.student_id = s.student_id`
    )).toThrow(/GuardrailViolation|Waada 1/);
  });

  it('every NEVER_JOIN table is caught when joined with wb_', () => {
    for (const banned of WB_GUARDRAILS.NEVER_JOIN_TABLES) {
      expect(() => assertNoBannedJoin(`SELECT * FROM wb_pulse JOIN ${banned} USING (student_id)`))
        .toThrow(GuardrailViolation);
    }
  });

  it('allows a clean wb-only query', () => {
    expect(() => assertNoBannedJoin(
      'SELECT mood, date FROM wb_pulse WHERE org_id = ? AND student_id = ?'
    )).not.toThrow();
  });

  it('ignores non-wb queries entirely (linter only guards wb_*)', () => {
    expect(() => assertNoBannedJoin('SELECT * FROM client_exam_result WHERE id = 1')).not.toThrow();
  });
});

describe('🔒 Aggregate guard — fewer than 5 hides everything', () => {
  it('returns insufficient_data for 4 students', () => {
    expect(assertAggregateSize(4)).toEqual({ insufficient_data: true, min_required: 5 });
  });

  it('returns null (data allowed) for exactly 5 students', () => {
    expect(assertAggregateSize(5)).toBeNull();
  });

  it('MIN_AGGREGATE_SIZE is hardcoded to 5, not configurable', () => {
    expect(WB_GUARDRAILS.MIN_AGGREGATE_SIZE).toBe(5);
    expect(Object.isFrozen(WB_GUARDRAILS)).toBe(true);
  });
});

describe('👤 Individual access — role + reason gate', () => {
  it('teacher cannot read individual data', () => {
    expect(() => assertCanSeeIndividual('teacher', 1, 42, 'looking at a red flag', jest.fn()))
      .toThrow(Forbidden);
  });

  it('principal cannot read individual data', () => {
    expect(() => assertCanSeeIndividual('principal', 1, 42, 'looking at a red flag', jest.fn()))
      .toThrow(Forbidden);
  });

  it('parent cannot read individual data', () => {
    expect(() => assertCanSeeIndividual('parent', 1, 42, 'i am worried', jest.fn()))
      .toThrow(Forbidden);
  });

  it('counsellor without a reason is rejected (400)', () => {
    expect(() => assertCanSeeIndividual('counsellor', 1, 42, '', jest.fn())).toThrow(BadRequest);
    expect(() => assertCanSeeIndividual('counsellor', 1, 42, 'too short', jest.fn())).toThrow(BadRequest);
  });

  it('counsellor WITH a reason is allowed and the read is audited', () => {
    const audit = jest.fn();
    expect(() =>
      assertCanSeeIndividual('counsellor', 1, 42, 'Red flag 15 Jul, first contact prep', audit)
    ).not.toThrow();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][0]).toMatchObject({ actorId: 1, subjectId: 42 });
  });
});

describe('🛡 Anti-harm invariants are frozen ON', () => {
  it.each([
    ['NO_RANKING'], ['NO_PUNISHMENT_LINK'], ['NO_PREDICTION'], ['NO_DIAGNOSIS'],
    ['ACADEMIC_ALONE_CANNOT_RED'], ['SELF_RAISE_ALWAYS_RED'],
    ['OPT_OUT_ALWAYS_AVAILABLE'], ['OPT_OUT_ZERO_PENALTY'], ['OPT_OUT_INVISIBLE_TO_STAFF'],
    ['CRISIS_OVERRIDES_CONSENT'],
  ])('%s is true', (key) => {
    expect(WB_GUARDRAILS[key]).toBe(true);
  });

  it('academic signal weight can never exceed 15', () => {
    expect(WB_GUARDRAILS.ACADEMIC_SIGNAL_MAX_WEIGHT).toBeLessThanOrEqual(15);
  });

  it('attendance signal weight can never exceed 25', () => {
    expect(WB_GUARDRAILS.ATTENDANCE_SIGNAL_MAX_WEIGHT).toBeLessThanOrEqual(25);
  });

  it('journal is visible only to the student', () => {
    expect(WB_GUARDRAILS.JOURNAL_VISIBLE_TO).toEqual(['student_self']);
  });

  it('red flags are visible only to the counsellor', () => {
    expect(WB_GUARDRAILS.RED_FLAG_VISIBLE_TO).toEqual(['counsellor']);
  });
});

describe('🚫 Boot self-check refuses a broken configuration', () => {
  const REAL_KEY = 'a-real-32-byte-master-key-value-01';

  it('fails boot when a ranking endpoint exists', async () => {
    process.env.WB_MASTER_KEY = REAL_KEY;
    const res = await verifyGuardrailsAtBoot({ routePaths: ['/api/wb/leaderboard'], skipDb: true });
    expect(res.ok).toBe(false);
    expect(res.failed.map(f => f.name)).toContain('no-ranking-endpoints');
  });

  it('fails boot when the journal master key is missing/default', async () => {
    process.env.WB_MASTER_KEY = 'change-me-32-byte-base64-master-key';
    const res = await verifyGuardrailsAtBoot({ routePaths: [], skipDb: true });
    expect(res.ok).toBe(false);
    expect(res.failed.map(f => f.name)).toContain('journal-master-key');
  });

  it('passes the pure (non-DB) checks with a real key and clean routes', async () => {
    process.env.WB_MASTER_KEY = REAL_KEY;
    const res = await verifyGuardrailsAtBoot({
      routePaths: ['/api/wb/pulse', '/api/wb/journal', '/api/wb/flags'],
      skipDb: true,
    });
    expect(res.ok).toBe(true);
  });
});

// ─── Coverage map for the Part-13 guardrail checklist ───────────────
// Most items are now asserted in the suite named beside them. The few that
// genuinely need a live MySQL (grants + append-only triggers) remain todos and
// are exercised by tests/db.integration.test.js when a DB is configured.
describe('🔜 Integration guardrails needing live MySQL', () => {
  it.todo('DB user cannot SELECT from client_exam_result (grant test)');
  it.todo('audit log UPDATE → DB error (append-only trigger)');
  it.todo('audit log DELETE → DB error (append-only trigger)');
  // Covered elsewhere:
  //   teacher/principal context → 403 ............ routes.auth.test.js
  //   parent pulse → 403 ......................... routes.auth.test.js
  //   no /rank /leaderboard /sorted → 404 ........ routes.auth.test.js
  //   counsellor read WITH reason → audit row .... counsellor.test.js
  //   aggregate < 5 → insufficient_data .......... counsellor.test.js
  //   journal encrypted, no plaintext at rest .... crypto.consent.test.js
  //   opted-out → zero rows ...................... pulse.journal.test.js
});

// Signal-engine guardrails — implemented in Week 5. Asserted here too so the
// critical suite carries the promises directly.
describe('🚨 Signal-engine guardrails (Week 5)', () => {
  const { compute } = require('../src/modules/wellbeing/wellbeing.signals');

  it('academic + attendance alone can never produce red', () => {
    const s = compute({ score_drop_20pct: true, attendance_absent_3: true });
    expect(s.total).toBeLessThan(60);
    expect(s.severity).not.toBe('red');
  });

  it('self-raise always produces red', () => {
    expect(compute({ self_raise: true }).severity).toBe('red');
  });
});
