'use strict';

const { sm2, responseToQuality, nextDifficulty } = require('../src/algorithms/sm2');

const NOW = new Date('2026-07-16T00:00:00Z');

describe('sm2', () => {
  it('first correct → interval 1 day', () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 0, repetitions: 0 }, 5, NOW);
    expect(r.repetitions).toBe(1);
    expect(r.interval_days).toBe(1);
  });
  it('second correct → interval 6 days', () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 1, repetitions: 1 }, 4, NOW);
    expect(r.repetitions).toBe(2);
    expect(r.interval_days).toBe(6);
  });
  it('third correct → interval grows using the pre-update ease factor (6 × 2.5 = 15)', () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 6, repetitions: 2 }, 5, NOW);
    expect(r.interval_days).toBe(15);
    expect(r.ease_factor).toBeGreaterThan(2.5); // ef bumped after interval computed
  });
  it('wrong → resets to interval 1, rep 0', () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 20, repetitions: 5 }, 1, NOW);
    expect(r.repetitions).toBe(0);
    expect(r.interval_days).toBe(1);
  });
  it('ease factor never below 1.3', () => {
    let card = { ease_factor: 1.3, interval_days: 1, repetitions: 1 };
    for (let i = 0; i < 5; i++) card = sm2(card, 0, NOW);
    expect(card.ease_factor).toBeGreaterThanOrEqual(1.3);
  });
  it('sets due_at forward by interval', () => {
    const r = sm2({ ease_factor: 2.5, interval_days: 0, repetitions: 0 }, 5, NOW);
    expect(new Date(r.due_at).getTime()).toBeGreaterThan(NOW.getTime());
  });
});

describe('responseToQuality', () => {
  it('fast + correct → 5', () => {
    expect(responseToQuality({ is_correct: true, time_ratio: 0.4 })).toBe(5);
  });
  it('slow but correct → 3', () => {
    expect(responseToQuality({ is_correct: true, time_ratio: 1.8 })).toBe(3);
  });
  it('thoughtful but wrong → 1', () => {
    expect(responseToQuality({ is_correct: false, time_ratio: 2.0 })).toBe(1);
  });
  it('fast guess wrong → 0', () => {
    expect(responseToQuality({ is_correct: false, time_ratio: 0.3 })).toBe(0);
  });
});

describe('nextDifficulty', () => {
  it.each([
    [90, 'hard'],
    [60, 'medium'],
    [20, 'easy'],
  ])('acc %i → %s', (acc, diff) => {
    expect(nextDifficulty(acc)).toBe(diff);
  });
});
