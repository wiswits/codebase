'use strict';

const {
  classifyResponse,
  buildBehaviourProfile,
  errorSignature,
} = require('../src/algorithms/behaviour');

describe('classifyResponse — the two students', () => {
  it('Aarav: easy + wrong + fast → silly_mistake', () => {
    const aarav = {
      time_sec: 22, est_time_sec: 60, difficulty: 'easy',
      is_correct: false, changed_count: 0, visits: 1,
      first_answer: 'B', final_answer: 'B',
    };
    expect(classifyResponse(aarav)).toBe('silly_mistake');
  });

  it('Priya: hard-ish + wrong + very slow + many changes → confused', () => {
    const priya = {
      time_sec: 180, est_time_sec: 60, difficulty: 'medium',
      is_correct: false, changed_count: 3, visits: 4,
      first_answer: 'A', final_answer: 'C',
    };
    expect(classifyResponse(priya)).toBe('confused');
  });

  it('hard + wrong + slow → concept_gap', () => {
    expect(
      classifyResponse({ time_sec: 120, est_time_sec: 60, difficulty: 'hard', is_correct: false, changed_count: 0, visits: 1 })
    ).toBe('concept_gap');
  });

  it('first correct → final wrong → overthinking', () => {
    const r = {
      time_sec: 70, est_time_sec: 60, difficulty: 'medium',
      is_correct: false, changed_count: 1, visits: 2,
      first_answer: 'A', final_answer: 'B', first_correct: true,
    };
    expect(classifyResponse(r)).toBe('overthinking');
  });

  it('very fast + no thought + wrong → guess', () => {
    expect(
      classifyResponse({ time_sec: 5, est_time_sec: 60, difficulty: 'medium', is_correct: false, changed_count: 0, visits: 1 })
    ).toBe('guess');
  });

  it('fast + correct → mastered; hard + very fast + correct → lucky_guess', () => {
    expect(classifyResponse({ time_sec: 20, est_time_sec: 60, difficulty: 'medium', is_correct: true })).toBe('mastered');
    expect(classifyResponse({ time_sec: 10, est_time_sec: 60, difficulty: 'hard', is_correct: true })).toBe('lucky_guess');
  });
});

describe('buildBehaviourProfile — archetypes', () => {
  it('a pile of easy+wrong+fast makes a rusher', () => {
    const responses = Array.from({ length: 10 }, () => ({
      time_sec: 22, est_time_sec: 60, difficulty: 'easy',
      is_correct: false, changed_count: 0, visits: 1,
    }));
    const p = buildBehaviourProfile(responses);
    expect(p.behaviour).toBe('rusher');
    expect(p.silly_mistake_rate).toBeGreaterThan(40);
    expect(p.pace).toBe('fast');
    expect(p.coaching_note).toMatch(/jaldbaazi/);
  });

  it('balanced when mostly solid (low correctness spread)', () => {
    const responses = Array.from({ length: 10 }, (_, i) => ({
      time_sec: 45, est_time_sec: 60, difficulty: 'medium',
      is_correct: i < 9, changed_count: 0, visits: 1,
    }));
    const p = buildBehaviourProfile(responses);
    expect(p.behaviour).toBe('balanced');
  });
});

describe('errorSignature', () => {
  it('ranks distractor reasons', () => {
    const responses = [
      { is_correct: false, distractor_reason: 'sign_error' },
      { is_correct: false, distractor_reason: 'sign_error' },
      { is_correct: false, distractor_reason: 'arithmetic_slip' },
      { is_correct: true },
    ];
    const sig = errorSignature(responses);
    expect(sig.list[0].reason).toBe('sign_error');
    expect(sig.list[0].pct).toBe(67); // 2 of 3 wrong
    expect(sig.wrong_total).toBe(3);
  });
});
