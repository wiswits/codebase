// ============================================
// UNIT TESTS - HELPERS
// ============================================

const {
    isValidEmail,
    isValidPhone,
    generateUUID,
    formatDate,
    calculatePercentage,
    calculatePercentile,
    calculateQuadrant,
    chunkArray,
    shuffleArray
} = require('../../src/utils/helpers');

describe('Helpers', () => {
    // ============================================
    // EMAIL VALIDATION
    // ============================================
    describe('isValidEmail', () => {
        test('should return true for valid email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.in')).toBe(true);
        });

        test('should return false for invalid email', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
        });
    });

    // ============================================
    // PHONE VALIDATION
    // ============================================
    describe('isValidPhone', () => {
        test('should return true for valid phone', () => {
            expect(isValidPhone('1234567890')).toBe(true);
        });

        test('should return false for invalid phone', () => {
            expect(isValidPhone('12345')).toBe(false);
            expect(isValidPhone('abcdefghij')).toBe(false);
        });
    });

    // ============================================
    // UUID GENERATION
    // ============================================
    describe('generateUUID', () => {
        test('should generate a valid UUID', () => {
            const uuid = generateUUID();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        test('should generate unique UUIDs', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    // ============================================
    // DATE FORMATTING
    // ============================================
    describe('formatDate', () => {
        test('should format date as YYYY-MM-DD', () => {
            const date = new Date('2026-07-20');
            expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-07-20');
        });

        test('should format date as DD-MM-YYYY', () => {
            const date = new Date('2026-07-20');
            expect(formatDate(date, 'DD-MM-YYYY')).toBe('20-07-2026');
        });

        test('should format date as DD MMM YYYY', () => {
            const date = new Date('2026-07-20');
            expect(formatDate(date, 'DD MMM YYYY')).toBe('20 Jul 2026');
        });
    });

    // ============================================
    // PERCENTAGE CALCULATION
    // ============================================
    describe('calculatePercentage', () => {
        test('should calculate percentage correctly', () => {
            expect(calculatePercentage(50, 100)).toBe(50);
            expect(calculatePercentage(25, 200)).toBe(12.5);
        });

        test('should return 0 when total is 0', () => {
            expect(calculatePercentage(50, 0)).toBe(0);
        });
    });

    // ============================================
    // PERCENTILE CALCULATION
    // ============================================
    describe('calculatePercentile', () => {
        test('should calculate percentile correctly', () => {
            const scores = [50, 60, 70, 80, 90, 100];
            expect(calculatePercentile(85, scores)).toBeCloseTo(83.33, 1);
        });

        test('should return 0 for empty array', () => {
            expect(calculatePercentile(85, [])).toBe(0);
        });
    });

    // ============================================
    // QUADRANT CALCULATION
    // ============================================
    describe('calculateQuadrant', () => {
        test('should return FAST_ACCURATE for high speed and accuracy', () => {
            expect(calculateQuadrant(80, 85)).toBe('FAST_ACCURATE');
        });

        test('should return FAST_INACCURATE for high speed and low accuracy', () => {
            expect(calculateQuadrant(80, 60)).toBe('FAST_INACCURATE');
        });

        test('should return SLOW_ACCURATE for low speed and high accuracy', () => {
            expect(calculateQuadrant(30, 85)).toBe('SLOW_ACCURATE');
        });

        test('should return SLOW_INACCURATE for low speed and accuracy', () => {
            expect(calculateQuadrant(30, 60)).toBe('SLOW_INACCURATE');
        });
    });

    // ============================================
    // ARRAY CHUNKING
    // ============================================
    describe('chunkArray', () => {
        test('should chunk array into smaller arrays', () => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8];
            const chunks = chunkArray(array, 3);
            expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8]]);
        });

        test('should return empty array for empty input', () => {
            expect(chunkArray([], 3)).toEqual([]);
        });
    });

    // ============================================
    // ARRAY SHUFFLING
    // ============================================
    describe('shuffleArray', () => {
        test('should return array with same elements', () => {
            const array = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(array);
            expect(shuffled.sort()).toEqual(array.sort());
        });

        test('should not modify original array', () => {
            const array = [1, 2, 3];
            const shuffled = shuffleArray(array);
            expect(shuffled).not.toBe(array);
        });
    });
});