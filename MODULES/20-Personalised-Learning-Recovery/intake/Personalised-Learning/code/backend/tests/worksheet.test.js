'use strict';

const {
  planWorksheet,
  behaviourOverride,
  selectTargets,
  ladderFor,
  orderByLadder,
  pickStrategy,
} = require('../src/algorithms/worksheet');

const root = { wiswits_id: 'MATH10C01T02', severity: 'critical', accuracy: 41, sample_size: 7, confidence: 0.82, is_root_cause: true, root_wiswits_id: 'MATH10C01T02' };
const symptom = { wiswits_id: 'MATH10C07T01', severity: 'critical', accuracy: 28, sample_size: 6, confidence: 0.7, is_root_cause: false, root_wiswits_id: 'MATH10C01T02' };

describe('root cause first', () => {
  it('root_first strategy targets the root, not the symptom', () => {
    const plan = planWorksheet([symptom, root], { behaviour: 'balanced' }, { strategy: 'root_first' });
    expect(plan.targets).toContain('MATH10C01T02');
    expect(plan.targets).not.toContain('MATH10C07T01');
  });
});

describe('difficulty ladder', () => {
  it('critical → 6 easy / 3 medium / 1 hard', () => {
    expect(ladderFor({ severity: 'critical' }, 'root_first')).toEqual({ easy: 6, medium: 3, hard: 1 });
  });
});

describe('max 2 targets', () => {
  it('never more than 2', () => {
    const many = [root, symptom,
      { wiswits_id: 'X', severity: 'weak', accuracy: 40, confidence: 0.6 },
      { wiswits_id: 'Y', severity: 'weak', accuracy: 45, confidence: 0.6 }];
    expect(selectTargets(many, 'mixed').length).toBeLessThanOrEqual(2);
  });
});

describe('behaviour override', () => {
  it('rusher + silly>40% → coaching, NOT worksheet', () => {
    const profile = { behaviour: 'rusher', silly_mistake_rate: 42, coaching_note: 'slow down' };
    const plan = planWorksheet([root], profile);
    expect(plan.skip_worksheet).toBe(true);
    expect(plan.type).toBe('coaching_note');
    expect(plan.suggested_action).toBe('accuracy_drill');
  });

  it('rusher with silly ≤ 40% still gets a worksheet', () => {
    expect(behaviourOverride({ behaviour: 'rusher', silly_mistake_rate: 30 })).toBeNull();
  });
});

describe('pickStrategy', () => {
  it('all mastered → challenge', () => {
    expect(pickStrategy([{ severity: 'mastered', is_root_cause: true }], {})).toBe('challenge');
  });
  it('has roots → root_first', () => {
    expect(pickStrategy([root], {})).toBe('root_first');
  });
  it('gives_up → confidence_build', () => {
    expect(pickStrategy([{ severity: 'weak', is_root_cause: false }], { behaviour: 'gives_up' })).toBe('confidence_build');
  });
});

describe('orderByLadder', () => {
  it('orders easy → medium → hard', () => {
    const qs = [{ difficulty: 'hard' }, { difficulty: 'easy' }, { difficulty: 'medium' }];
    const ordered = orderByLadder(qs, () => 0); // deterministic
    expect(ordered.map((q) => q.difficulty)).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('empty', () => {
  it('no weak areas → null', () => {
    expect(planWorksheet([], {})).toBeNull();
  });
});
