'use strict';

const { findRootCauses, traceToRoot } = require('../src/algorithms/rootCause');

// C07 requires C03 requires C01 requires 9C01 (which is NOT weak)
const GRAPH = {
  MATH10C07T01: { requires: ['MATH10C03T02'], enables: [] },
  MATH10C03T02: { requires: ['MATH10C01T02'], enables: ['MATH10C07T01'] },
  MATH10C01T02: { requires: ['MATH09C01T03'], enables: ['MATH10C03T02'] },
  MATH09C01T03: { requires: [], enables: ['MATH10C01T02'] },
};

function mk(id, acc) {
  return { wiswits_id: id, accuracy: acc, severity: 'weak' };
}

describe('The Money Example', () => {
  it('Ch07 + Ch03 + Ch01 weak → Ch01 is the root', () => {
    const candidates = [
      mk('MATH10C07T01', 28),
      mk('MATH10C03T02', 34),
      mk('MATH10C01T02', 41),
    ];
    const out = findRootCauses(candidates, GRAPH);
    const byId = Object.fromEntries(out.map((c) => [c.wiswits_id, c]));

    expect(byId.MATH10C01T02.is_root_cause).toBe(true);
    expect(byId.MATH10C01T02.depth_from_root).toBe(0);
    expect(byId.MATH10C03T02.root_wiswits_id).toBe('MATH10C01T02');
    expect(byId.MATH10C03T02.depth_from_root).toBe(1);
    expect(byId.MATH10C07T01.root_wiswits_id).toBe('MATH10C01T02');
    expect(byId.MATH10C07T01.depth_from_root).toBe(2);
  });

  it('sorts root causes first', () => {
    const out = findRootCauses(
      [mk('MATH10C07T01', 28), mk('MATH10C03T02', 34), mk('MATH10C01T02', 41)],
      GRAPH
    );
    expect(out[0].is_root_cause).toBe(true);
    expect(out[0].wiswits_id).toBe('MATH10C01T02');
  });
});

describe('safety: cycle guard', () => {
  it('circular prerequisites do not infinite-loop', () => {
    const cyclic = {
      A: { requires: ['B'] },
      B: { requires: ['A'] },
    };
    const candidates = [mk('A', 20), mk('B', 25)];
    const t0 = Date.now();
    const out = findRootCauses(candidates, cyclic);
    expect(Date.now() - t0).toBeLessThan(500);
    expect(out).toHaveLength(2);
  });

  it('depth > 10 breaks (long chain)', () => {
    const graph = {};
    const candidates = [];
    for (let i = 0; i < 20; i++) {
      const id = `N${i}`;
      graph[id] = { requires: i < 19 ? [`N${i + 1}`] : [] };
      candidates.push(mk(id, 30 - i * 0.1));
    }
    const chain = traceToRoot(graph, new Set(candidates.map((c) => c.wiswits_id)),
      Object.fromEntries(candidates.map((c) => [c.wiswits_id, c])), 'N0');
    expect(chain.depth).toBeLessThanOrEqual(11);
  });
});

describe('topic with no weak prereq is its own root', () => {
  it('single weak topic', () => {
    const out = findRootCauses([mk('MATH10C01T02', 41)], GRAPH);
    expect(out[0].is_root_cause).toBe(true);
    expect(out[0].root_wiswits_id).toBe('MATH10C01T02');
  });
});
