'use strict';

const {
  percentileBand,
  computeTrend,
  buildNarrative,
  buildComparison,
} = require('../src/algorithms/benchmark');

describe('percentileBand — dignity wording', () => {
  it.each([
    [95, 'top_10'],
    [80, 'top_25'],
    [50, 'middle_50'],
    [10, 'needs_support'],
  ])('%i → %s', (p, band) => {
    expect(percentileBand(p)).toBe(band);
  });
  it('never says bottom_25', () => {
    expect(percentileBand(5)).toBe('needs_support');
  });
});

describe('computeTrend', () => {
  it('improving when newest > oldest by 5+', () => {
    expect(computeTrend([{ accuracy: 67 }, { accuracy: 60 }, { accuracy: 48 }])).toBe('improving');
  });
  it('declining when it drops', () => {
    expect(computeTrend([{ accuracy: 40 }, { accuracy: 55 }])).toBe('declining');
  });
});

describe('buildNarrative — self first', () => {
  it('leads with self-improvement', () => {
    const lines = buildNarrative({ my: { accuracy: 67 }, classAvg: 61, previous: 48, best: 64, topper: 94 });
    expect(lines[0]).toMatch(/Pichli baar/);
  });
  it('topper mention is a gap only, never a name', () => {
    const lines = buildNarrative({ my: { accuracy: 85 }, classAvg: 61, previous: 80, best: 80, topper: 94 });
    expect(lines.join(' ')).toMatch(/Topper se sirf 9%/);
  });
});

describe('buildComparison — no rank anywhere', () => {
  const payload = buildComparison({
    my: { accuracy: 67, score: 27, max: 40, time_ratio: 0.58 },
    peers: { class_avg: 61, section_avg: 64, school_avg: 59, topper_accuracy: 94, p90: 88, p75: 80, p50: 63, p25: 45, class_median: 63 },
    history: [{ accuracy: 67, test_title: 'T6' }, { accuracy: 64, test_title: 'T5' }],
    percentile: 78,
  });

  it('exposes percentile + band but NOT rank', () => {
    expect(payload.position.percentile).toBe(78);
    expect(payload.position.band).toBe('top_25');
    expect(JSON.stringify(payload)).not.toMatch(/"rank"/);
    expect(JSON.stringify(payload)).not.toMatch(/leaderboard/);
  });

  it('topper is a number, not a name', () => {
    expect(payload.peers.topper).toBe(94);
    expect(typeof payload.peers.topper).toBe('number');
  });

  it('computes self + peer gaps', () => {
    expect(payload.gaps.to_class_avg).toBe(6);
    expect(payload.gaps.to_previous).toBe(3);
  });
});
