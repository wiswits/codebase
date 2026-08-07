// ============================================
// FACULTY ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GET FACULTY PROFILE (Current user)
    // ============================================
    router.get('/profile/me', auth.isFaculty, async (req, res, next) => {
        try {
            const userId = req.userId;

            const result = await pool.query(
                `SELECT f.*, u.email, u.first_name, u.last_name, u.phone
                 FROM faculty f
                 JOIN users u ON f.user_id = u.id
                 WHERE f.user_id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty profile not found'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET FACULTY DASHBOARD STATS
    // ============================================
    router.get('/dashboard/stats', auth.isFaculty, async (req, res, next) => {
        try {
            const userId = req.userId;

            // Get faculty ID
            const facultyResult = await pool.query(
                'SELECT id FROM faculty WHERE user_id = $1',
                [userId]
            );

            if (facultyResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty profile not found'
                });
            }

            const facultyId = facultyResult.rows[0].id;

            // Get students count
            const studentsResult = await pool.query(
                `SELECT COUNT(DISTINCT s.id) as count
                 FROM students s
                 JOIN batch_students bs ON s.id = bs.student_id
                 JOIN batches b ON bs.batch_id = b.id
                 WHERE b.id IN (
                     SELECT batch_id FROM tests WHERE created_by = $1
                 )`,
                [facultyId]
            );

            // Get doubts resolved
            const doubtsResult = await pool.query(
                `SELECT 
                    COUNT(*) as total_resolved,
                    COUNT(CASE WHEN resolution_rating >= 4 THEN 1 END) as highly_rated
                 FROM doubts
                 WHERE resolved_by = $1 AND status = 'resolved'`,
                [facultyId]
            );

            // Get tests created
            const testsResult = await pool.query(
                `SELECT COUNT(*) as total_tests
                 FROM tests
                 WHERE created_by = $1`,
                [facultyId]
            );

            // Get avg response time
            const responseResult = await pool.query(
                `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600) as avg_hours
                 FROM doubts
                 WHERE resolved_by = $1 AND resolved_at IS NOT NULL`,
                [facultyId]
            );

            res.json({
                success: true,
                data: {
                    students: parseInt(studentsResult.rows[0]?.count || 0),
                    doubtsResolved: parseInt(doubtsResult.rows[0]?.total_resolved || 0),
                    highlyRated: parseInt(doubtsResult.rows[0]?.highly_rated || 0),
                    testsCreated: parseInt(testsResult.rows[0]?.total_tests || 0),
                    avgResponseHours: parseFloat(responseResult.rows[0]?.avg_hours || 0)
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET FACULTY'S STUDENTS
    // ============================================
    router.get('/students', auth.isFaculty, async (req, res, next) => {
        try {
            const userId = req.userId;
            const { search, limit = 50, offset = 0 } = req.query;

            // Get faculty ID
            const facultyResult = await pool.query(
                'SELECT id FROM faculty WHERE user_id = $1',
                [userId]
            );

            if (facultyResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty profile not found'
                });
            }

            const facultyId = facultyResult.rows[0].id;

            let query = `
                SELECT DISTINCT s.*, u.first_name, u.last_name, u.email,
                       b.name as batch_name, b.type as batch_type,
                       (SELECT AVG(score_obtained) FROM attempts WHERE student_id = s.id) as avg_score
                FROM students s
                JOIN users u ON s.user_id = u.id
                JOIN batch_students bs ON s.id = bs.student_id
                JOIN batches b ON bs.batch_id = b.id
                WHERE b.id IN (
                    SELECT DISTINCT batch_id FROM tests WHERE created_by = $1
                )
            `;
            const params = [facultyId];
            let paramIndex = 2;

            if (search) {
                query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR s.student_code ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(DISTINCT s.id) as count
                 FROM students s
                 JOIN batch_students bs ON s.id = bs.student_id
                 JOIN batches b ON bs.batch_id = b.id
                 WHERE b.id IN (
                     SELECT DISTINCT batch_id FROM tests WHERE created_by = $1
                 )`,
                [facultyId]
            );

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0]?.count || 0),
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET FACULTY'S BATCHES
    // ============================================
    router.get('/batches', auth.isFaculty, async (req, res, next) => {
        try {
            const userId = req.userId;

            const result = await pool.query(
                `SELECT DISTINCT b.*,
                    (SELECT COUNT(*) FROM batch_students WHERE batch_id = b.id AND is_current = true) as student_count
                 FROM batches b
                 JOIN tests t ON t.batch_id = b.id
                 WHERE t.created_by = (SELECT id FROM faculty WHERE user_id = $1)`,
                [userId]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET FACULTY PERFORMANCE METRICS
    // ============================================
    router.get('/performance', auth.isFaculty, async (req, res, next) => {
        try {
            const userId = req.userId;

            const facultyResult = await pool.query(
                'SELECT id FROM faculty WHERE user_id = $1',
                [userId]
            );

            if (facultyResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Faculty profile not found'
                });
            }

            const facultyId = facultyResult.rows[0].id;

            // Overall rating
            const ratingResult = await pool.query(
                'SELECT rating FROM faculty WHERE id = $1',
                [facultyId]
            );

            // Doubt resolution rate
            const doubtRateResult = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
                 FROM doubts
                 WHERE assigned_to = $1`,
                [facultyId]
            );

            // Test completion rate
            const testRateResult = await pool.query(
                `SELECT 
                    COUNT(*) as total_tests,
                    COUNT(CASE WHEN is_published = true THEN 1 END) as published
                 FROM tests
                 WHERE created_by = $1`,
                [facultyId]
            );

            // Student improvement (avg score increase)
            const improvementResult = await pool.query(
                `SELECT 
                    s.id,
                    s.student_code,
                    u.first_name,
                    u.last_name,
                    (SELECT AVG(score_obtained) FROM attempts WHERE student_id = s.id AND test_id IN (SELECT id FROM tests WHERE created_by = $1)) as avg_score
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 JOIN batch_students bs ON s.id = bs.student_id
                 JOIN batches b ON bs.batch_id = b.id
                 WHERE b.id IN (SELECT batch_id FROM tests WHERE created_by = $1)
                 ORDER BY avg_score DESC`,
                [facultyId]
            );

            res.json({
                success: true,
                data: {
                    rating: parseFloat(ratingResult.rows[0]?.rating || 0),
                    doubtResolutionRate: doubtRateResult.rows[0]?.total > 0 
                        ? Math.round((doubtRateResult.rows[0].resolved / doubtRateResult.rows[0].total) * 100) 
                        : 0,
                    testCompletionRate: testRateResult.rows[0]?.total_tests > 0
                        ? Math.round((testRateResult.rows[0].published / testRateResult.rows[0].total_tests) * 100)
                        : 0,
                    studentImprovement: improvementResult.rows || [],
                    totalStudents: improvementResult.rows.length
                }
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};