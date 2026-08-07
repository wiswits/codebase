/**
 * studentObservations.editRules.test.js
 *
 * Owner: Jatin
 * Covers: controlled edit validation (Section 12/26/37) —
 * record existence, organization scope, author/coordinator/principal rule,
 * validation errors, and that a successful update calls the shared audit helper.
 *
 * The repository and audit modules are mocked to isolate service-level
 * business rules from the DB/audit implementations.
 *
 * TODO: confirm the real shared audit helper import path/signature to
 * match the mock target below.
 * TODO: confirm the real mapper module path/shape (dbRowToApi) — owned by Neha.
 */

'use strict';

jest.mock('../studentObservations.repository');
jest.mock('../../../shared/audit', () => jest.fn());
jest.mock('../studentObservations.mapper', () => ({
  dbRowToApi: jest.fn((row) => ({
    id: row.id,
    organizationId: row.org_id,
    studentId: row.student_id,
    authorId: row.author_id,
    observationType: row.observation_type,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })),
}));

const repository = require('../studentObservations.repository');
const audit = require('../../../shared/audit');
const service = require('../studentObservations.service');
const { canEditRecord, ObservationError } = service;

function makeReq(user, params = {}, body = {}) {
  return { user, params, body };
}

describe('canEditRecord', () => {
  test('author may edit their own record', () => {
    const user = { id: 1, org_id: 1, role: 'teacher' };
    const record = { author_id: 1 };
    expect(canEditRecord(user, record)).toBe(true);
  });

  test('a different teacher may not edit someone else\'s record', () => {
    const user = { id: 2, org_id: 1, role: 'teacher' };
    const record = { author_id: 1 };
    expect(canEditRecord(user, record)).toBe(false);
  });

  test('principal may edit any record in scope', () => {
    const user = { id: 99, org_id: 1, role: 'principal' };
    const record = { author_id: 1 };
    expect(canEditRecord(user, record)).toBe(true);
  });

  test('coordinator may edit any record in scope', () => {
    const user = { id: 88, org_id: 1, role: 'coordinator' };
    const record = { author_id: 1 };
    expect(canEditRecord(user, record)).toBe(true);
  });
});

describe('updateObservation - controlled edit flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a non-integer id with VALIDATION_ERROR', async () => {
    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });
    await expect(service.updateObservation(req, 'abc', { content: 'x' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(repository.findObservationForEdit).not.toHaveBeenCalled();
  });

  test('rejects an empty body with VALIDATION_ERROR', async () => {
    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });
    await expect(service.updateObservation(req, '5', {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  });

  test('rejects an unsupported observationType with VALIDATION_ERROR', async () => {
    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });
    await expect(
      service.updateObservation(req, '5', { observationType: 'not_real' })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('returns NOT_FOUND when record does not exist in caller org (no cross-tenant leak)', async () => {
    repository.findObservationForEdit.mockResolvedValue(null);
    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });

    await expect(
      service.updateObservation(req, '5', { content: 'updated' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });

    expect(repository.updateObservation).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  test('returns FORBIDDEN when caller did not author the record and has no elevated role', async () => {
    repository.findObservationForEdit.mockResolvedValue({
      id: 5,
      org_id: 1,
      author_id: 999,
      observation_type: 'anecdotal',
      content: 'original',
    });
    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });

    await expect(
      service.updateObservation(req, '5', { content: 'updated' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });

    expect(repository.updateObservation).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  test('allows the author to update their own record and calls audit', async () => {
    const existing = {
      id: 5,
      org_id: 1,
      author_id: 1,
      observation_type: 'anecdotal',
      content: 'original',
    };
    const updated = { ...existing, content: 'updated content', observation_type: 'class_school' };

    repository.findObservationForEdit.mockResolvedValue(existing);
    repository.updateObservation.mockResolvedValue(updated);

    const req = makeReq({ id: 1, org_id: 1, role: 'teacher' });

    const result = await service.updateObservation(req, '5', {
      observationType: 'class_school',
      content: 'updated content',
    });

    expect(repository.updateObservation).toHaveBeenCalledWith(
      5,
      1,
      { observationType: 'class_school', content: 'updated content' }
    );
    expect(audit).toHaveBeenCalledWith(req, 'student_observation.updated', 'student_observation', 5);
    expect(result.content).toBe('updated content');
  });

  test('allows a principal to update a record authored by someone else', async () => {
    const existing = {
      id: 6,
      org_id: 1,
      author_id: 42,
      observation_type: 'anecdotal',
      content: 'original',
    };
    repository.findObservationForEdit.mockResolvedValue(existing);
    repository.updateObservation.mockResolvedValue({ ...existing, content: 'edited by principal' });

    const req = makeReq({ id: 1, org_id: 1, role: 'principal' });

    await service.updateObservation(req, '6', { content: 'edited by principal' });

    expect(repository.updateObservation).toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(req, 'student_observation.updated', 'student_observation', 6);
  });

  test('never allows a record from another organization to be updated', async () => {
    // Repository is org-scoped internally; simulate that a cross-org lookup
    // correctly returns null rather than the other org's record.
    repository.findObservationForEdit.mockResolvedValue(null);
    const req = makeReq({ id: 1, org_id: 1, role: 'principal' });

    await expect(
      service.updateObservation(req, '999', { content: 'x' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(repository.findObservationForEdit).toHaveBeenCalledWith(999, 1);
  });
});
