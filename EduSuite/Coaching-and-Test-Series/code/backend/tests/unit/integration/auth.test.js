// ============================================
// INTEGRATION TESTS - AUTH
// ============================================

const request = require('supertest');
const { app, pool } = require('../../server');

describe('Auth API', () => {
    // ============================================
    // REGISTER
    // ============================================
    describe('POST /api/auth/register', () => {
        test('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    // ============================================
    // LOGIN
    // ============================================
    describe('POST /api/auth/login', () => {
        test('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should return 401 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});