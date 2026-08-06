'use strict';

const { classifyOutcome, nextAction, canStartCycle } = require('../src/algorithms/recoveryCycle');

describe('classifyOutcome', () => {
  it('≥70% after → closed', () => {
    expect(classifyOutcome(41, 78).outcome).toBe('closed');
  });
  it('+15 or more but under 70 → improved', () => {
    expect(classifyOutcome(30, 50).outcome).toBe('improved');
  });
  it('small change → no_change', () => {
    expect(classifyOutcome(40, 42).outcome).toBe('no_change');
  });
  it('drop of 5+ → worsened', () => {
    expect(classifyOutcome(40, 30).outcome).toBe('worsened');
  });
  it('reports delta', () => {
    expect(classifyOutcome(41, 78).delta).toBe(37);
  });
});

describe('nextAction', () => {
  it('closed → close weak area + recheck dependents', () => {
    const a = nextAction('closed');
    expect(a.action).toBe('close_weak_area');
    expect(a.recheck_dependents).toBe(true);
  });
  it('worsened → immediate escalation', () => {
    const a = nextAction('worsened');
    expect(a.escalate).toBe(true);
    expect(a.action).toBe('escalate');
  });
  it('no_change → try confidence_build', () => {
    expect(nextAction('no_change').strategy).toBe('confidence_build');
  });
  it('improved → another mixed cycle', () => {
    expect(nextAction('improved').strategy).toBe('mixed');
  });
});

describe('canStartCycle — 3 cycles max', () => {
  it('allows cycles 1..3', () => {
    expect(canStartCycle(0)).toMatchObject({ allowed: true, cycleNo: 1 });
    expect(canStartCycle(2)).toMatchObject({ allowed: true, cycleNo: 3 });
  });
  it('4th cycle → needs teacher', () => {
    const r = canStartCycle(3);
    expect(r.allowed).toBe(false);
    expect(r.needsTeacher).toBe(true);
  });
});
