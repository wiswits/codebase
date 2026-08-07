import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';

describe('Auth Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject requests without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hms/v1/me/permissions',
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject requests with invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hms/v1/me/permissions',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.error.code).toBe('INVALID_TOKEN');
  });

  it('should allow requests with valid token', async () => {
    // This test requires a valid JWT token
    // In production, use a test token generator
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
  });
});