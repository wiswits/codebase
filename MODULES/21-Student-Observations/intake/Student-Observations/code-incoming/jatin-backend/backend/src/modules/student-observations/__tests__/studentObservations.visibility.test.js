/**
 * studentObservations.visibility.test.js
 *
 * Owner: Jatin
 * Covers: role-scoped visibility clause construction (Section 29).
 *
 * TODO: once the real class-scope join (teacher -> class -> observation)
 * is confirmed with Neha/Khushboo, extend these tests to cover the
 * "applicable class-scoped observations" case for teachers instead of the
 * current conservative own-authored-only default.
 */

'use strict';

jest.mock('../../../shared/db', () => ({
  query: jest.fn(),
}));

const { buildVisibilityClause } = require('../studentObservations.repository');

describe('buildVisibilityClause', () => {
  test('always includes org_id scoping regardless of role', () => {
    const teacher = { id: 1, org_id: 7, role: 'teacher' };
    const { clause, params } = buildVisibilityClause(teacher);
    expect(clause).toMatch(/org_id = \?/);
    expect(params[0]).toBe(7);
  });

  test('principal gets org-wide visibility with no author restriction', () => {
    const principal = { id: 2, org_id: 7, role: 'principal' };
    const { clause, params } = buildVisibilityClause(principal);
    expect(clause).toBe('org_id = ?');
    expect(params).toEqual([7]);
  });

  test('coordinator gets org-wide visibility (permission-gated upstream)', () => {
    const coordinator = { id: 3, org_id: 7, role: 'coordinator' };
    const { clause, params } = buildVisibilityClause(coordinator);
    expect(clause).toBe('org_id = ?');
    expect(params).toEqual([7]);
  });

  test('teacher (default) is restricted to own-authored records', () => {
    const teacher = { id: 4, org_id: 7, role: 'teacher' };
    const { clause, params } = buildVisibilityClause(teacher);
    expect(clause).toBe('org_id = ? AND author_id = ?');
    expect(params).toEqual([7, 4]);
  });

  test('unrecognized/undefined role falls back to the conservative teacher default', () => {
    const unknownRole = { id: 5, org_id: 7, role: undefined };
    const { clause, params } = buildVisibilityClause(unknownRole);
    expect(clause).toBe('org_id = ? AND author_id = ?');
    expect(params).toEqual([7, 5]);
  });

  test('never trusts an org_id supplied anywhere except the authenticated user object', () => {
    // Simulates req.user built strictly from the authenticated context.
    const user = { id: 6, org_id: 42, role: 'teacher' };
    const { params } = buildVisibilityClause(user);
    expect(params[0]).toBe(42);
  });
});
