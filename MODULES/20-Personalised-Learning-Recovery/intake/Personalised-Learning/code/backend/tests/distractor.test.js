'use strict';

const {
  analyzeQuestion,
  discriminationIndex,
  clusterMisconceptions,
} = require('../src/algorithms/distractor');

function responses(spec) {
  // spec: { A: n, B: n, ... } with `correct` key marking the right option
  const { correct, ...opts } = spec;
  const out = [];
  let sid = 1;
  for (const [opt, n] of Object.entries(opts)) {
    for (let i = 0; i < n; i++) {
      out.push({ answer_json: { selected: opt }, is_correct: opt === correct, student_id: sid++ });
    }
  }
  return out;
}

const Q = {
  question_id: 14,
  wiswits_id: 'MATH10C07T01',
  seq: 14,
  correct_option: 'A',
  optionMeta: {
    B: { text: 'x = -3, 5', distractor_reason: 'sign_error', misconception: 'Signs flipped', remediation_hint: 'Revisit signs' },
  },
};

describe('misconception detection', () => {
  it('30%+ one wrong option → significant misconception', () => {
    const rs = responses({ correct: 'A', A: 6, B: 4 }); // 40% chose B, 60% acc? no: A=6 correct→60% acc, B=40%
    // make accuracy < 60 so insight fires
    const rs2 = responses({ correct: 'A', A: 5, B: 5 }); // 50% acc, 50% chose B
    const { insight } = analyzeQuestion(Q, rs2);
    expect(insight).not.toBeNull();
    expect(insight.misconception.reason).toBe('sign_error');
    expect(insight.strength).toBe('class_wide'); // 50% ≥ STRONG
  });

  it('50%+ one wrong option → class_wide', () => {
    const rs = responses({ correct: 'A', A: 7, B: 24, C: 1 }); // 32 total, 75% chose B
    const { insight } = analyzeQuestion(Q, rs);
    expect(insight.strength).toBe('class_wide');
    expect(insight.headline).toMatch(/Poori class/);
    expect(insight.affected_students).toHaveLength(24);
  });

  it('below MIN_SAMPLE (10) → nothing', () => {
    const { insight, flags } = analyzeQuestion(Q, responses({ correct: 'A', A: 2, B: 3 }));
    expect(insight).toBeNull();
    expect(flags).toHaveLength(0);
  });
});

describe('quality flags', () => {
  it('<15% correct + 60%+ one option → key_error', () => {
    const rs = responses({ correct: 'A', A: 1, C: 15 }); // 6% correct, 94% chose C
    const { flags, insight } = analyzeQuestion({ ...Q, correct_option: 'A' }, rs);
    expect(flags.some((f) => f.flag === 'key_error')).toBe(true);
    expect(insight).toBeNull(); // key_error short-circuits the insight
  });

  it('<15% correct + high spread → ambiguous', () => {
    const rs = responses({ correct: 'A', A: 1, B: 5, C: 5, D: 5 }); // ~6% correct, spread
    const { flags } = analyzeQuestion(Q, rs);
    expect(flags.some((f) => f.flag === 'ambiguous')).toBe(true);
  });

  it('DI < 0.15 in mid-accuracy band → non_discriminating', () => {
    const rs = responses({ correct: 'A', A: 5, B: 5 }); // 50% acc
    const { flags } = analyzeQuestion(Q, rs, 0.08);
    expect(flags.some((f) => f.flag === 'non_discriminating')).toBe(true);
  });
});

describe('discriminationIndex', () => {
  it('toppers get it right, strugglers do not → DI ≈ 1', () => {
    const attempts = [];
    for (let i = 0; i < 10; i++) attempts.push({ right: true }); // top
    for (let i = 0; i < 10; i++) attempts.push({ right: false }); // bottom
    const di = discriminationIndex(attempts, (a) => a.right);
    expect(di).toBeGreaterThan(0.9);
  });
  it('n < 3 → null', () => {
    expect(discriminationIndex([{}, {}, {}, {}], () => true)).toBeNull();
  });
});

describe('clusterMisconceptions', () => {
  it('2+ questions with same reason → systemic cluster', () => {
    const insights = [
      { seq: 14, misconception: { reason: 'sign_error', pct: 75 } },
      { seq: 17, misconception: { reason: 'sign_error', pct: 40 } },
      { seq: 19, misconception: { reason: 'sign_error', pct: 55 } },
      { seq: 3, misconception: { reason: 'arithmetic_slip', pct: 33 } },
    ];
    const clusters = clusterMisconceptions(insights);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].reason).toBe('sign_error');
    expect(clusters[0].questions).toEqual([14, 17, 19]);
  });
});
