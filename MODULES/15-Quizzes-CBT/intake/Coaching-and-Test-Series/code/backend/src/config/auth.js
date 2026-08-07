// ============================================
// AUTHENTICATION CONFIGURATION
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ============================================
// BCRYPT CONFIG
// ============================================
const bcryptConfig = {
    saltRounds: 10,
};

// ============================================
// JWT CONFIG
// ============================================
const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: '30d',
    algorithm: 'HS256',
};

// ============================================
// HASH PASSWORD
// ============================================
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(bcryptConfig.saltRounds);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('Error hashing password: ' + error.message);
    }
};

// ============================================
// COMPARE PASSWORD
// ============================================
const comparePassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error('Error comparing password: ' + error.message);
    }
};

// ============================================
// GENERATE TOKEN
// ============================================
const generateToken = (payload, expiresIn = jwtConfig.expiresIn) => {
    try {
        return jwt.sign(
            payload,
            jwtConfig.secret,
            { expiresIn, algorithm: jwtConfig.algorithm }
        );
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
};

// ============================================
// VERIFY TOKEN
// ============================================
const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw new Error('Token verification failed: ' + error.message);
    }
};

// ============================================
// GENERATE REFRESH TOKEN
// ============================================
const generateRefreshToken = (payload) => {
    return generateToken(payload, jwtConfig.refreshExpiresIn);
};

// ============================================
// DECODE TOKEN (Without verification)
// ============================================
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    bcryptConfig,
    jwtConfig,
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateRefreshToken,
    decodeToken
};