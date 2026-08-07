import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';

describe('Cross-Tenant Security Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // Mock tenant tokens
  const mockTokenOrgA = 'mock-token-org-a';
  const mockTokenOrgB = 'mock-token-org-b';

  it('should prevent accessing Org A resources with Org B token', async () => {
    // Try to access a resource from Org A using Org B token
    const response = await app.inject({
      method: 'GET',
      url: '/hms/v1/hierarchy/hostels',
      headers: {
        authorization: `Bearer ${mockTokenOrgB}`,
      },
      query: {
        // This would be an Org A resource ID
        hostelId: '12345678-1234-1234-1234-123456789abc',
      },
    });

    // Should return 404, not 403 (don't leak existence)
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should prevent accessing Org B resources with Org A token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hms/v1/hierarchy/hostels',
      headers: {
        authorization: `Bearer ${mockTokenOrgA}`,
      },
      query: {
        hostelId: '87654321-4321-4321-4321-cba987654321',
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should enforce tenant isolation on all endpoints', async () => {
    // List of endpoints to test
    const endpoints = [
      { method: 'GET', url: '/hms/v1/hierarchy/hostels' },
      { method: 'GET', url: '/hms/v1/hierarchy/buildings' },
      { method: 'GET', url: '/hms/v1/hierarchy/rooms' },
      { method: 'GET', url: '/hms/v1/allocation/allocations' },
    ];

    for (const endpoint of endpoints) {
      const response = await app.inject({
        method: endpoint.method,
        url: endpoint.url,
        headers: {
          authorization: `Bearer ${mockTokenOrgB}`,
        },
        query: {
          hostelId: '12345678-1234-1234-1234-123456789abc',
        },
      });

      // Should always return 404 for cross-tenant requests
      expect(response.statusCode).toBe(404);
    }
  });
});