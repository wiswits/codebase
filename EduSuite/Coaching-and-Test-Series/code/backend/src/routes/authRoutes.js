// ============================================
// AUTH ROUTES
// ============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = function(pool) {
    const router = require('express').Router();

    // ============================================
    // REGISTER
    // ============================================
    router.post('/register', async (req, res, next) => {
        try {
            const { email, password, first_name, last_name, phone, role = 'student' } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Check if user exists
            const userCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (userCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Create user
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, email, role, first_name, last_name, created_at`,
                [email, passwordHash, role, first_name, last_name, phone]
            );

            const user = result.rows[0];

            // If student, create student profile
            if (role === 'student') {
                const studentCode = `STU-${Date.now()}`;
                await pool.query(
                    `INSERT INTO students (user_id, student_code, enrollment_date)
                     VALUES ($1, $2, CURRENT_DATE)`,
                    [user.id, studentCode]
                );
            }

            // If faculty, create faculty profile
            if (role === 'faculty') {
                const facultyCode = `FAC-${Date.now()}`;
                await pool.query(
                    `INSERT INTO faculty (user_id, faculty_code, hire_date)
                     VALUES ($1, $2, CURRENT_DATE)`,
                    [user.id, facultyCode]
                );
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

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
    });

    // ============================================
    // LOGIN
    // ============================================
    router.post('/login', async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

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
            const isValid = await bcrypt.compare(password, user.password_hash);
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

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

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
    });

    // ============================================
    // GET CURRENT USER
    // ============================================
    router.get('/me', async (req, res, next) => {
        try {
            // This will be protected by auth middleware
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

            // Get additional profile data based on role
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
    });

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    router.put('/change-password', async (req, res, next) => {
        try {
            const userId = req.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

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
            const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await pool.query(
                'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newHash, userId]
            );

            res.json({
                success: true,
                message: 'Password updated successfully'
            });

        } catch (error) {
            next(error);
        }
    });

    return router;
};