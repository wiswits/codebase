// ============================================
// CONSTANTS
// ============================================

// ============================================
// USER ROLES
// ============================================
const USER_ROLES = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    ADMIN: 'admin'
};

const USER_ROLES_LIST = Object.values(USER_ROLES);

// ============================================
// BATCH TYPES
// ============================================
const BATCH_TYPES = {
    ALPHA: 'alpha',
    BETA: 'beta',
    GAMMA: 'gamma'
};

const BATCH_TYPES_LIST = Object.values(BATCH_TYPES);

// ============================================
// TEST TYPES
// ============================================
const TEST_TYPES = {
    PART_SYLLABUS: 'part',
    FULL_SYLLABUS: 'full',
    AITS: 'aits',
    MOCK: 'mock',
    CUSTOM: 'custom'
};

const TEST_TYPES_LIST = Object.values(TEST_TYPES);

// ============================================
// TEST MODES
// ============================================
const TEST_MODES = {
    ONLINE: 'online',
    OMR: 'omr',
    BOTH: 'both'
};

const TEST_MODES_LIST = Object.values(TEST_MODES);

// ============================================
// ATTEMPT STATUS
// ============================================
const ATTEMPT_STATUS = {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    EVALUATED: 'evaluated'
};

const ATTEMPT_STATUS_LIST = Object.values(ATTEMPT_STATUS);

// ============================================
// DOUBT STATUS
// ============================================
const DOUBT_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    ESCALATED: 'escalated'
};

const DOUBT_STATUS_LIST = Object.values(DOUBT_STATUS);

// ============================================
// DPP STATUS
// ============================================
const DPP_STATUS = {
    PENDING: 'pending',
    STARTED: 'started',
    SUBMITTED: 'submitted',
    EVALUATED: 'evaluated'
};

const DPP_STATUS_LIST = Object.values(DPP_STATUS);

// ============================================
// QUESTION TYPES
// ============================================
const QUESTION_TYPES = {
    MCQ: 'mcq',
    MULTI_SELECT: 'multi_select',
    NAT: 'nat',
    INTEGER: 'integer',
    TRUE_FALSE: 'true_false'
};

const QUESTION_TYPES_LIST = Object.values(QUESTION_TYPES);

// ============================================
// DIFFICULTY LEVELS
// ============================================
const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    VERY_HARD: 'very_hard'
};

const DIFFICULTY_LIST = Object.values(DIFFICULTY);

// ============================================
// STUDENT STATUS
// ============================================
const STUDENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    GRADUATED: 'graduated',
    TRIAL: 'trial',
    DROPPED: 'dropped'
};

const STUDENT_STATUS_LIST = Object.values(STUDENT_STATUS);

// ============================================
// EXAM TYPES
// ============================================
const EXAM_TYPES = {
    JEE_MAIN: 'JEE_MAIN',
    JEE_ADVANCED: 'JEE_ADVANCED',
    NEET: 'NEET',
    NTSE: 'NTSE',
    RMO: 'RMO',
    INMO: 'INMO',
    FOUNDATION: 'FOUNDATION',
    OTHER: 'OTHER'
};

const EXAM_TYPES_LIST = Object.values(EXAM_TYPES);

// ============================================
// SPEED ACCURACY QUADRANTS
// ============================================
const QUADRANTS = {
    FAST_ACCURATE: 'FAST_ACCURATE',
    FAST_INACCURATE: 'FAST_INACCURATE',
    SLOW_ACCURATE: 'SLOW_ACCURATE',
    SLOW_INACCURATE: 'SLOW_INACCURATE'
};

const QUADRANT_LIST = Object.values(QUADRANTS);

// ============================================
// API RESPONSE STATUS
// ============================================
const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    FAIL: 'fail'
};

// ============================================
// HTTP STATUS CODES
// ============================================
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    INTERNAL_SERVER: 500
};

// ============================================
// PAGINATION DEFAULTS
// ============================================
const PAGINATION = {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 200,
    DEFAULT_OFFSET: 0
};

// ============================================
// SLA DEFAULTS (in hours)
// ============================================
const SLA = {
    ACKNOWLEDGE: 1,
    RESOLVE: 24,
    ESCALATE: 48
};

// ============================================
// DPP DEFAULTS
// ============================================
const DPP_DEFAULTS = {
    DEFAULT_QUESTIONS: 12,
    MAX_QUESTIONS: 30,
    MIN_QUESTIONS: 5,
    STREAK_RESET: 0
};

// ============================================
// TEST DEFAULTS
// ============================================
const TEST_DEFAULTS = {
    MARKS_CORRECT: 4,
    MARKS_INCORRECT: -1,
    MARKS_UNATTEMPTED: 0,
    MIN_DURATION: 30,
    MAX_DURATION: 360
};

// ============================================
// FILE UPLOAD
// ============================================
const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
};

// ============================================
// REGEX PATTERNS
// ============================================
const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[0-9]{10}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    STUDENT_CODE: /^STU-[0-9]+$/,
    FACULTY_CODE: /^FAC-[0-9]+$/
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    USER_ROLES,
    USER_ROLES_LIST,
    BATCH_TYPES,
    BATCH_TYPES_LIST,
    TEST_TYPES,
    TEST_TYPES_LIST,
    TEST_MODES,
    TEST_MODES_LIST,
    ATTEMPT_STATUS,
    ATTEMPT_STATUS_LIST,
    DOUBT_STATUS,
    DOUBT_STATUS_LIST,
    DPP_STATUS,
    DPP_STATUS_LIST,
    QUESTION_TYPES,
    QUESTION_TYPES_LIST,
    DIFFICULTY,
    DIFFICULTY_LIST,
    STUDENT_STATUS,
    STUDENT_STATUS_LIST,
    EXAM_TYPES,
    EXAM_TYPES_LIST,
    QUADRANTS,
    QUADRANT_LIST,
    RESPONSE_STATUS,
    HTTP_STATUS,
    PAGINATION,
    SLA,
    DPP_DEFAULTS,
    TEST_DEFAULTS,
    FILE_UPLOAD,
    REGEX
};