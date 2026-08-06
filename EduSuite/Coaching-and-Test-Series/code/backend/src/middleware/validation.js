// ============================================
// VALIDATION MIDDLEWARE - Request Validation
// ============================================

const Joi = require('joi');

// ============================================
// VALIDATION SCHEMAS
// ============================================

const schemas = {
    // Auth Schemas
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        first_name: Joi.string().max(100),
        last_name: Joi.string().max(100),
        phone: Joi.string().pattern(/^[0-9]{10}$/),
        role: Joi.string().valid('student', 'faculty', 'admin').default('student')
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required()
    }),

    // Student Schemas
    updateStudent: Joi.object({
        dob: Joi.date(),
        gender: Joi.string().valid('M', 'F', 'O'),
        address: Joi.string(),
        parent_name: Joi.string().max(200),
        parent_phone: Joi.string().pattern(/^[0-9]{10}$/),
        parent_email: Joi.string().email(),
        target_exam: Joi.string(),
        current_batch_id: Joi.number().integer().positive(),
        status: Joi.string().valid('active', 'inactive', 'graduated')
    }),

    // Test Schemas
    createTest: Joi.object({
        title: Joi.string().required(),
        type: Joi.string().valid('part', 'full', 'aits', 'mock', 'custom').required(),
        mode: Joi.string().valid('online', 'omr', 'both').required(),
        duration_minutes: Joi.number().integer().min(30).max(360).required(),
        total_marks: Joi.number().integer().min(0),
        marking_scheme: Joi.object({
            correct: Joi.number().default(4),
            incorrect: Joi.number().default(-1),
            unattempted: Joi.number().default(0)
        }),
        subjects: Joi.array().items(Joi.string()),
        syllabus: Joi.string(),
        instructions: Joi.string(),
        scheduled_at: Joi.date(),
        batch_id: Joi.number().integer().positive(),
        question_ids: Joi.array().items(Joi.number().integer().positive())
    }),

    // Attempt Schemas
    startAttempt: Joi.object({
        test_id: Joi.number().integer().positive().required()
    }),

    saveAnswer: Joi.object({
        attempt_id: Joi.number().integer().positive().required(),
        question_id: Joi.number().integer().positive().required(),
        answer: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string()),
            Joi.number()
        ).required()
    }),

    submitAttempt: Joi.object({
        attempt_id: Joi.number().integer().positive().required()
    }),

    // Doubt Schemas
    createDoubt: Joi.object({
        subject: Joi.string().required(),
        title: Joi.string().required(),
        description: Joi.string().required(),
        file_url: Joi.string().uri(),
        question_id: Joi.number().integer().positive()
    }),

    assignDoubt: Joi.object({
        faculty_id: Joi.number().integer().positive().required()
    }),

    rateDoubt: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required()
    }),

    // DPP Schemas
    generateDPP: Joi.object({
        studentId: Joi.number().integer().positive().required(),
        count: Joi.number().integer().min(5).max(30).default(12),
        difficulty: Joi.string().valid('easy', 'medium', 'hard', 'mixed').default('mixed')
    }),

    submitDPP: Joi.object({
        dpp_id: Joi.number().integer().positive().required(),
        answers: Joi.object().pattern(
            Joi.number().integer().positive(),
            Joi.alternatives().try(Joi.string(), Joi.array(), Joi.number())
        ).required()
    })
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        req.body = value;
        next();
    };
};

// ============================================
// PARAM VALIDATION
// ============================================

const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                errors: error.details.map(d => d.message)
            });
        }

        req.params = value;
        next();
    };
};

// ============================================
// QUERY VALIDATION
// ============================================

const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.details.map(d => d.message)
            });
        }

        req.query = value;
        next();
    };
};

module.exports = {
    schemas,
    validate,
    validateParams,
    validateQuery
};