// ============================================
// TEST SETUP
// ============================================

const { pool } = require('../src/config/database');

// ============================================
// BEFORE ALL TESTS
// ============================================
beforeAll(async () => {
    // Ensure database is connected
    await pool.query('SELECT 1');
});

// ============================================
// AFTER ALL TESTS
// ============================================
afterAll(async () => {
    // Close database connection
    await pool.end();
});

// ============================================
// BEFORE EACH TEST
// ============================================
beforeEach(() => {
    // Clear any test data if needed
});

// ============================================
// AFTER EACH TEST
// ============================================
afterEach(() => {
    // Clean up test data if needed
});