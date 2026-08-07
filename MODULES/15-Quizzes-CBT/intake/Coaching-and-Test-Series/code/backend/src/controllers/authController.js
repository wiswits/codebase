// ============================================
// AUTH CONTROLLER
// ============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { hashPassword, comparePassword, generateToken } = require('../config/auth');
const { logger } = require('../config/logger');

// ============================================
// REGISTER
// ============================================
const register = async (req, res, next) => {
    try {
        const { email, password, first_name, last_name, phone, role = 'student' } = req.body;

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, role, first_name, last_name, created_at`,
            [email, passwordHash, role, first_name, last_name, phone]
        );

        const user = result.rows[0];

        // Create student or faculty profile
        if (role === 'student') {
            await pool.query(
                `INSERT INTO students (user_id, student_code, enrollment_date)
                 VALUES ($1, $2, CURRENT_DATE)`,
                [user.id, `STU-${Date.now()}`]
            );
        } else if (role === 'faculty') {
            await pool.query(
                `INSERT INTO faculty (user_id, faculty_code, hire_date)
                 VALUES ($1, $2, CURRENT_DATE)`,
                [user.id, `FAC-${Date.now()}`]
            );
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        logger.info(`User registered: ${email} (${role})`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// LOGIN
// ============================================
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query(
            `SELECT id, email, password_hash, role, first_name, last_name, is_active
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been disabled'
            });
        }

        // Verify password
        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        logger.info(`User logged in: ${email}`);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// GET CURRENT USER
// ============================================
const getMe = async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await pool.query(
            `SELECT id, email, role, first_name, last_name, phone, is_active, created_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        // Get additional profile data
        let profile = null;
        if (user.role === 'student') {
            const profileResult = await pool.query(
                `SELECT * FROM students WHERE user_id = $1`,
                [userId]
            );
            profile = profileResult.rows[0] || null;
        } else if (user.role === 'faculty') {
            const profileResult = await pool.query(
                `SELECT * FROM faculty WHERE user_id = $1`,
                [userId]
            );
            profile = profileResult.rows[0] || null;
        }

        res.json({
            success: true,
            data: { ...user, profile }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// CHANGE PASSWORD
// ============================================
const changePassword = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        // Get user
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newHash = await hashPassword(newPassword);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newHash, userId]
        );

        logger.info(`Password changed for user: ${userId}`);

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// LOGOUT
// ============================================
const logout = async (req, res) => {
    // JWT is stateless, so logout is client-side
    // But we can blacklist tokens if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    register,
    login,
    getMe,
    changePassword,
    logout
};