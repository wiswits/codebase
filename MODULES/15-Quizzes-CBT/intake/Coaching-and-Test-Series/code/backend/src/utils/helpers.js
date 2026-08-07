// ============================================
// HELPER FUNCTIONS
// ============================================

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { REGEX, PAGINATION } = require('./constants');

// ============================================
// VALIDATION HELPERS
// ============================================
const isValidEmail = (email) => {
    return REGEX.EMAIL.test(email);
};

const isValidPhone = (phone) => {
    return REGEX.PHONE.test(phone);
};

const isValidPassword = (password) => {
    return REGEX.PASSWORD.test(password);
};

const isValidUUID = (uuid) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

// ============================================
// GENERATION HELPERS
// ============================================
const generateUUID = () => {
    return uuidv4();
};

const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

const generateRandomString = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const generateStudentCode = () => {
    return `STU-${Date.now()}`;
};

const generateFacultyCode = () => {
    return `FAC-${Date.now()}`;
};

// ============================================
// DATE HELPERS
// ============================================
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD-MM-YYYY':
            return `${day}-${month}-${year}`;
        case 'YYYY-MM-DD HH:mm:ss':
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        case 'DD MMM YYYY':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${day} ${months[d.getMonth()]} ${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
};

const isDateInPast = (date) => {
    return new Date(date) < new Date();
};

const isDateInFuture = (date) => {
    return new Date(date) > new Date();
};

const daysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================
// PAGINATION HELPERS
// ============================================
const getPagination = (query) => {
    const limit = Math.min(
        parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_LIMIT
    );
    const offset = parseInt(query.offset) || PAGINATION.DEFAULT_OFFSET;
    const cursor = query.cursor || null;

    return { limit, offset, cursor };
};

const getPaginationMeta = (total, limit, offset) => {
    return {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0
    };
};

// ============================================
// MATH HELPERS
// ============================================
const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

const calculatePercentile = (score, scores) => {
    if (!scores || scores.length === 0) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const rank = sorted.filter(s => s < score).length;
    return (rank / sorted.length) * 100;
};

const calculateQuadrant = (speed, accuracy) => {
    const avgSpeed = 50; // Average speed percentile
    const avgAccuracy = 70; // Average accuracy percentage

    if (speed >= avgSpeed && accuracy >= avgAccuracy) return 'FAST_ACCURATE';
    if (speed >= avgSpeed && accuracy < avgAccuracy) return 'FAST_INACCURATE';
    if (speed < avgSpeed && accuracy >= avgAccuracy) return 'SLOW_ACCURATE';
    return 'SLOW_INACCURATE';
};

// ============================================
// ARRAY HELPERS
// ============================================
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const uniqueArray = (array) => {
    return [...new Set(array)];
};

// ============================================
// OBJECT HELPERS
// ============================================
const pick = (obj, keys) => {
    return keys.reduce((result, key) => {
        if (obj && obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
};

const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};

const safeJSONParse = (str, fallback = null) => {
    try {
        return JSON.parse(str);
    } catch (error) {
        return fallback;
    }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    // Validation
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidUUID,
    
    // Generation
    generateUUID,
    generateOTP,
    generateRandomString,
    generateStudentCode,
    generateFacultyCode,
    
    // Date
    formatDate,
    isDateInPast,
    isDateInFuture,
    daysBetween,
    
    // Pagination
    getPagination,
    getPaginationMeta,
    
    // Math
    calculatePercentage,
    calculatePercentile,
    calculateQuadrant,
    
    // Array
    chunkArray,
    shuffleArray,
    uniqueArray,
    
    // Object
    pick,
    omit,
    safeJSONParse
};