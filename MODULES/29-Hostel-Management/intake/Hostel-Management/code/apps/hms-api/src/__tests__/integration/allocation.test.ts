import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';

describe('Allocation Integration Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    // Get auth token for tests
    // authToken = await getTestToken();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should prevent double allocation of same bed', async () => {
    const allocationData = {
      apexStudentId: 'student-1',
      bedId: 'bed-1',
      effectiveFrom: new Date().toISOString(),
    };

    // First allocation should succeed
    const response1 = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData,
    });

    expect(response1.statusCode).toBe(201);

    // Second allocation should fail
    const response2 = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData,
    });

    expect(response2.statusCode).toBe(409);
    const body = JSON.parse(response2.payload);
    expect(body.error.code).toBe('BED_ALREADY_ALLOCATED');
  });

  it('should prevent student from having multiple allocations', async () => {
    const studentId = 'student-2';
    const allocationData1 = {
      apexStudentId: studentId,
      bedId: 'bed-2',
      effectiveFrom: new Date().toISOString(),
    };

    const allocationData2 = {
      apexStudentId: studentId,
      bedId: 'bed-3',
      effectiveFrom: new Date().toISOString(),
    };

    // First allocation should succeed
    const response1 = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData1,
    });

    expect(response1.statusCode).toBe(201);

    // Second allocation should fail
    const response2 = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData2,
    });

    expect(response2.statusCode).toBe(409);
    const body = JSON.parse(response2.payload);
    expect(body.error.code).toBe('STUDENT_ALREADY_ALLOCATED');
  });

  it('should prevent allocation without fee clearance', async () => {
    const allocationData = {
      apexStudentId: 'student-3',
      bedId: 'bed-4',
      effectiveFrom: new Date().toISOString(),
    };

    // Mock fee service to return not cleared
    const response = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData,
    });

    expect(response.statusCode).toBe(422);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('FEE_NOT_CLEARED');
  });

  it('should prevent gender mismatch allocation', async () => {
    const allocationData = {
      apexStudentId: 'student-4',
      bedId: 'bed-5',
      effectiveFrom: new Date().toISOString(),
    };

    // Mock student gender mismatch
    const response = await app.inject({
      method: 'POST',
      url: '/hms/v1/allocation/allocations',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: allocationData,
    });

    expect(response.statusCode).toBe(422);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('GENDER_MISMATCH');
  });
});