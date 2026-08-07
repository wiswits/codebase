'use strict';

const {
  classify,
  computeConfidence,
  evaluateTopic,
  detectFromTopics,
  analyzeErrorPattern,
} = require('../src/algorithms/weakAreaDetector');

const NOW = new Date('2026-07-16T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe('classify (severity bands)', () => {
  it.each([
    [0, 'critical'],
    [29, 'critical'],
    [30, 'weak'],
    [49, 'weak'],
    [50, 'borderline'],
    [69, 'borderline'],
    [70, 'strong'],
    [84, 'strong'],
    [85, 'mastered'],
    [100, 'mastered'],
  ])('accuracy %i → %s', (acc, sev) => {
    expect(classify(acc)).toBe(sev);
  });
});

describe('GATE 1 — min sample of 3', () => {
  it('1-2 attempts never flags a weak area', () => {
    expect(evaluateTopic({ attempted: 1, accuracy: 10, last_attempt_at: daysAgo(1) }, NOW).action).toBe('skip');
    expect(evaluateTopic({ attempted: 2, accuracy: 10, last_attempt_at: daysAgo(1) }, NOW).action).toBe('skip');
  });
  it('3 attempts can flag', () => {
    const r = evaluateTopic({ attempted: 8, accuracy: 35, last_attempt_at: daysAgo(1), variance: 5 }, NOW);
    expect(r.action).toBe('candidate');
  });
});

describe('GATE 2 — 90-day recency → decayed', () => {
  it('stale data marks decayed, not weak', () => {
    const r = evaluateTopic({ attempted: 10, accuracy: 20, last_attempt_at: daysAgo(120) }, NOW);
    expect(r.action).toBe('decay');
  });
});

describe('GATE 3 — strong/mastered closes instead of flagging', () => {
  it('72% accuracy closes as improved', () => {
    const r = evaluateTopic({ attempted: 10, accuracy: 72, last_attempt_at: daysAgo(2) }, NOW);
    expect(r.action).toBe('close');
    expect(r.reason).toBe('improved_naturally');
  });
});

describe('GATE 4 — confidence < 0.4 → silent', () => {
  it('sparse + old data stays silent', () => {
    // 3 attempts, 65 days old, high variance → confidence ≈ 0.34, below 0.4
    const r = evaluateTopic({ attempted: 3, accuracy: 20, last_attempt_at: daysAgo(65), variance: 40 }, NOW);
    expect(r.action).toBe('skip');
    expect(r.gate).toBe('confidence');
  });
});

describe('computeConfidence', () => {
  it('is higher with more, fresher, consistent data', () => {
    const strong = computeConfidence({ attempted: 10, last_attempt_at: daysAgo(1), variance: 2 }, NOW);
    const weak = computeConfidence({ attempted: 3, last_attempt_at: daysAgo(80), variance: 40 }, NOW);
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThanOrEqual(1);
    expect(weak).toBeGreaterThanOrEqual(0);
  });
});

describe('detectFromTopics buckets', () => {
  it('splits into candidates / decay / close', () => {
    const topics = [
      { wiswits_id: 'A', subject_id: 1, attempted: 10, accuracy: 30, last_attempt_at: daysAgo(1), variance: 5 }, // candidate
      { wiswits_id: 'B', subject_id: 1, attempted: 10, accuracy: 90, last_attempt_at: daysAgo(1) }, // close
      { wiswits_id: 'C', subject_id: 1, attempted: 10, accuracy: 20, last_attempt_at: daysAgo(200) }, // decay
      { wiswits_id: 'D', subject_id: 1, attempted: 1, accuracy: 10, last_attempt_at: daysAgo(1) }, // skip
    ];
    const { candidates, toDecay, toClose } = detectFromTopics(topics, NOW);
    expect(candidates.map((c) => c.wiswits_id)).toEqual(['A']);
    expect(toClose.map((c) => c.wiswits_id)).toEqual(['B']);
    expect(toDecay).toEqual(['C']);
  });
});

describe('analyzeErrorPattern', () => {
  it('finds dominant error type and weakest bloom', () => {
    const res = analyzeErrorPattern([
      { distractor_reason: 'sign_error', bloom: 'apply' },
      { distractor_reason: 'sign_error', bloom: 'apply' },
      { distractor_reason: 'arithmetic_slip', bloom: 'analyze' },
    ]);
    expect(res.dominantError).toBe('sign_error');
    expect(res.weakestBloom).toBe('apply');
  });
});
