// ============================================
// INTEGRATION TESTS - STUDENT
// ============================================

const request = require('supertest');
const { app, pool } = require('../../server');

let authToken;
let studentId;

describe('Student API', () => {
    // ============================================
    // SETUP
    // ============================================
    beforeAll(async () => {
        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'student@edutech.com',
                password: 'password123'
            });

        authToken = loginResponse.body.data.token;

        // Get student ID
        const studentResponse = await request(app)
            .get('/api/students/profile/me')
            .set('Authorization', `Bearer ${authToken}`);

        studentId = studentResponse.body.data.id;
    });

    // ============================================
    // GET STUDENT PROFILE
    // ============================================
    describe('GET /api/students/profile/me', () => {
        test('should get student profile', async () => {
            const response = await request(app)
                .get('/api/students/profile/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('student_code');
        });

        test('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/students/profile/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    // ============================================
    // GET STUDENT ANALYTICS
    // ============================================
    describe('GET /api/students/:id/analytics', () => {
        test('should get student analytics', async () => {
            const response = await request(app)
                .get(`/api/students/${studentId}/analytics`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('stats');
        });
    });
});