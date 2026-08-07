/**
 * studentObservations.filters.test.js
 *
 * Owner: Jatin
 * Covers: pagination, search, studentId filter, observationType filter,
 * and that org_id scoping is always applied regardless of other filters.
 *
 * The shared DB module is mocked — these are unit tests of the query
 * construction/business logic, not integration tests against MariaDB.
 *
 * TODO: confirm the real shared DB helper module path for this mock target
 * to match the actual import used in studentObservations.repository.js.
 */

'use strict';

jest.mock('../../../shared/db', () => ({
  query: jest.fn(),
}));

const { query } = require('../../../shared/db');
const repository = require('../studentObservations.repository');

const baseUser = { id: 10, org_id: 1, role: 'principal' };

describe('listObservations - filters and pagination', () => {
  beforeEach(() => {
    query.mockReset();
  });

  test('applies default pagination (page=1, limit=20)', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }]) // count query
      .mockResolvedValueOnce([]); // list query

    await repository.listObservations(baseUser, { page: 1, limit: 20 });

    const [listSql, listParams] = query.mock.calls[1];
    expect(listSql).toMatch(/LIMIT \? OFFSET \?/);
    expect(listParams.slice(-2)).toEqual([20, 0]);
  });

  test('computes correct offset for page 3, limit 10', async () => {
    query
      .mockResolvedValueOnce([{ total: 25 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, { page: 3, limit: 10 });

    const [, listParams] = query.mock.calls[1];
    expect(listParams.slice(-2)).toEqual([10, 20]); // offset = (3-1)*10
  });

  test('always scopes by org_id regardless of other filters', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, {
      page: 1,
      limit: 20,
      studentId: 999,
      observationType: 'anecdotal',
      search: 'ignore this org id',
    });

    const [countSql, countParams] = query.mock.calls[0];
    expect(countSql).toMatch(/org_id = \?/);
    expect(countParams).toContain(baseUser.org_id);
  });

  test('applies studentId filter when provided', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, { page: 1, limit: 20, studentId: 101 });

    const [countSql, countParams] = query.mock.calls[0];
    expect(countSql).toMatch(/student_id = \?/);
    expect(countParams).toContain(101);
  });

  test('applies observationType filter when provided', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, {
      page: 1,
      limit: 20,
      observationType: 'class_school',
    });

    const [countSql, countParams] = query.mock.calls[0];
    expect(countSql).toMatch(/observation_type = \?/);
    expect(countParams).toContain('class_school');
  });

  test('applies search filter as a LIKE clause when provided', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, { page: 1, limit: 20, search: 'late' });

    const [countSql, countParams] = query.mock.calls[0];
    expect(countSql).toMatch(/content LIKE \?/);
    expect(countParams).toContain('%late%');
  });

  test('omits filters that were not provided', async () => {
    query
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([]);

    await repository.listObservations(baseUser, { page: 1, limit: 20 });

    const [countSql] = query.mock.calls[0];
    expect(countSql).not.toMatch(/student_id = \?/);
    expect(countSql).not.toMatch(/observation_type = \?/);
    expect(countSql).not.toMatch(/content LIKE \?/);
  });

  test('returns total and rows from the DB responses', async () => {
    query
      .mockResolvedValueOnce([{ total: 3 }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await repository.listObservations(baseUser, { page: 1, limit: 20 });

    expect(result.total).toBe(3);
    expect(result.rows).toHaveLength(3);
  });
});

describe('validateListQuery - validator-level checks', () => {
  const { validateListQuery } = require('../studentObservations.validator');

  test('defaults page to 1 and limit to 20 when omitted', () => {
    const { valid, data } = validateListQuery({});
    expect(valid).toBe(true);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  test('caps limit at 100 even if a larger value is requested', () => {
    const { data } = validateListQuery({ limit: '500' });
    expect(data.limit).toBe(100);
  });

  test('rejects a non-numeric page', () => {
    const { valid, errors } = validateListQuery({ page: 'abc' });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('rejects an unsupported observationType', () => {
    const { valid, errors } = validateListQuery({ observationType: 'medical' });
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/observationType/);
  });

  test('rejects a non-integer studentId', () => {
    const { valid } = validateListQuery({ studentId: 'abc' });
    expect(valid).toBe(false);
  });

  test('accepts a valid full query', () => {
    const { valid, data } = validateListQuery({
      page: '2',
      limit: '10',
      search: 'incident',
      studentId: '5',
      observationType: 'anecdotal',
    });
    expect(valid).toBe(true);
    expect(data).toEqual({
      page: 2,
      limit: 10,
      search: 'incident',
      studentId: 5,
      observationType: 'anecdotal',
    });
  });
});
