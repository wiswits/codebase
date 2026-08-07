// ============================================
// CUSTOM VALIDATORS
// ============================================

const { REGEX } = require('./constants');

// ============================================
// FIELD VALIDATORS
// ============================================
const validateEmail = (email) => {
    if (!email) return { valid: false, message: 'Email is required' };
    if (!REGEX.EMAIL.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
};

const validatePhone = (phone) => {
    if (!phone) return { valid: true };
    if (!REGEX.PHONE.test(phone)) {
        return { valid: false, message: 'Phone number must be 10 digits' };
    }
    return { valid: true };
};

const validatePassword = (password) => {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    return { valid: true };
};

const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === '') {
        return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
};

const validateMinLength = (value, min, fieldName) => {
    if (value && value.length < min) {
        return { valid: false, message: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true };
};

const validateMaxLength = (value, max, fieldName) => {
    if (value && value.length > max) {
        return { valid: false, message: `${fieldName} must not exceed ${max} characters` };
    }
    return { valid: true };
};

const validateNumber = (value, fieldName) => {
    if (value !== undefined && value !== null && isNaN(value)) {
        return { valid: false, message: `${fieldName} must be a valid number` };
    }
    return { valid: true };
};

const validateRange = (value, min, max, fieldName) => {
    if (value !== undefined && value !== null) {
        if (value < min || value > max) {
            return { valid: false, message: `${fieldName} must be between ${min} and ${max}` };
        }
    }
    return { valid: true };
};

const validateDate = (date, fieldName) => {
    if (date && isNaN(new Date(date).getTime())) {
        return { valid: false, message: `${fieldName} must be a valid date` };
    }
    return { valid: true };
};

const validateEnum = (value, enumValues, fieldName) => {
    if (value && !enumValues.includes(value)) {
        return { 
            valid: false, 
            message: `${fieldName} must be one of: ${enumValues.join(', ')}` 
        };
    }
    return { valid: true };
};

// ============================================
// OBJECT VALIDATORS
// ============================================
const validateStudent = (data) => {
    const errors = [];

    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) errors.push(emailResult.message);

    const phoneResult = validatePhone(data.phone);
    if (!phoneResult.valid) errors.push(phoneResult.message);

    const firstNameResult = validateRequired(data.first_name, 'First name');
    if (!firstNameResult.valid) errors.push(firstNameResult.message);

    return {
        valid: errors.length === 0,
        errors
    };
};

const validateTest = (data) => {
    const errors = [];

    const titleResult = validateRequired(data.title, 'Test title');
    if (!titleResult.valid) errors.push(titleResult.message);

    const durationResult = validateNumber(data.duration_minutes, 'Duration');
    if (!durationResult.valid) errors.push(durationResult.message);

    if (data.duration_minutes) {
        const rangeResult = validateRange(data.duration_minutes, 30, 360, 'Duration');
        if (!rangeResult.valid) errors.push(rangeResult.message);
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

const validateDoubt = (data) => {
    const errors = [];

    const subjectResult = validateRequired(data.subject, 'Subject');
    if (!subjectResult.valid) errors.push(subjectResult.message);

    const titleResult = validateRequired(data.title, 'Title');
    if (!titleResult.valid) errors.push(titleResult.message);

    const descResult = validateRequired(data.description, 'Description');
    if (!descResult.valid) errors.push(descResult.message);

    return {
        valid: errors.length === 0,
        errors
    };
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    // Field validators
    validateEmail,
    validatePhone,
    validatePassword,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateNumber,
    validateRange,
    validateDate,
    validateEnum,
    
    // Object validators
    validateStudent,
    validateTest,
    validateDoubt
};