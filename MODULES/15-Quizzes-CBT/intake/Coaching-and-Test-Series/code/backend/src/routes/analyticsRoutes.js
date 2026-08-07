// ============================================
// ANALYTICS ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GET STUDENT ANALYTICS
    // ============================================
    router.get('/student/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;
            const { limit = 10 } = req.query;

            // Get all analytics for student
            const result = await pool.query(
                `SELECT a.*, t.title as test_title, t.type as test_type,
                        a2.all_india_rank, a2.batch_rank, a2.all_india_percentile
                 FROM analytics a2
                 JOIN attempts a ON a2.attempt_id = a.id
                 JOIN tests t ON a.test_id = t.id
                 WHERE a2.student_id = $1
                 ORDER BY a2.calculated_at DESC
                 LIMIT $2`,
                [studentId, limit]
            );

            // Get overall stats
            const statsResult = await pool.query(
                `SELECT 
                    COUNT(*) as total_attempts,
                    AVG(total_score) as avg_score,
                    AVG(overall_accuracy) as avg_accuracy,
                    MAX(total_score) as highest_score,
                    MIN(total_score) as lowest_score
                 FROM analytics
                 WHERE student_id = $1`,
                [studentId]
            );

            // Get subject-wise performance
            const subjectResult = await pool.query(
                `SELECT 
                    key as subject,
                    AVG(value::numeric) as avg_score,
                    MAX(value::numeric) as max_score
                 FROM analytics,
                 jsonb_each_text(subject_wise_scores)
                 WHERE student_id = $1
                 GROUP BY key
                 ORDER BY avg_score DESC`,
                [studentId]
            );

            // Get latest rank
            const rankResult = await pool.query(
                `SELECT all_india_rank, batch_rank, all_india_percentile
                 FROM analytics
                 WHERE student_id = $1
                 ORDER BY calculated_at DESC
                 LIMIT 1`,
                [studentId]
            );

            // Get speed vs accuracy quadrant
            const quadrantResult = await pool.query(
                `SELECT speed_accuracy_quadrant, COUNT(*) as count
                 FROM analytics
                 WHERE student_id = $1
                 GROUP BY speed_accuracy_quadrant`,
                [studentId]
            );

            res.json({
                success: true,
                data: {
                    attempts: result.rows,
                    stats: statsResult.rows[0] || {},
                    subjectPerformance: subjectResult.rows || [],
                    currentRank: rankResult.rows[0] || null,
                    quadrantDistribution: quadrantResult.rows || []
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET RANK CARD FOR ATTEMPT
    // ============================================
    router.get('/rank-card/:attemptId', async (req, res, next) => {
        try {
            const { attemptId } = req.params;

            const result = await pool.query(
                `SELECT a2.*, a.student_id, a.test_id, a.score_obtained,
                        t.title as test_title, t.total_marks,
                        s.student_code, u.first_name, u.last_name
                 FROM analytics a2
                 JOIN attempts a ON a2.attempt_id = a.id
                 JOIN tests t ON a.test_id = t.id
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE a2.attempt_id = $1`,
                [attemptId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Rank card not found'
                });
            }

            // Get subject-wise breakdown
            const subjectResult = await pool.query(
                `SELECT 
                    key as subject,
                    value as score
                 FROM analytics,
                 jsonb_each_text(subject_wise_scores)
                 WHERE attempt_id = $1`,
                [attemptId]
            );

            const rankCard = result.rows[0];
            rankCard.subject_breakdown = subjectResult.rows || [];

            // Get topper comparison if available
            if (rankCard.topper_id) {
                const topperResult = await pool.query(
                    `SELECT s.student_code, u.first_name, u.last_name, a2.topper_score
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     JOIN analytics a2 ON a2.topper_id = s.id
                     WHERE s.id = $1 AND a2.attempt_id = $2`,
                    [rankCard.topper_id, attemptId]
                );
                rankCard.topper = topperResult.rows[0] || null;
            }

            res.json({
                success: true,
                data: rankCard
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET SPEED VS ACCURACY QUADRANT
    // ============================================
    router.get('/quadrant/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;

            const result = await pool.query(
                `SELECT 
                    speed_accuracy_quadrant,
                    COUNT(*) as count,
                    AVG(overall_accuracy) as avg_accuracy,
                    AVG(average_time_per_question) as avg_time
                 FROM analytics
                 WHERE student_id = $1
                 GROUP BY speed_accuracy_quadrant`,
                [studentId]
            );

            // Get latest quadrant
            const latestResult = await pool.query(
                `SELECT speed_accuracy_quadrant
                 FROM analytics
                 WHERE student_id = $1
                 ORDER BY calculated_at DESC
                 LIMIT 1`,
                [studentId]
            );

            res.json({
                success: true,
                data: {
                    distribution: result.rows || [],
                    currentQuadrant: latestResult.rows[0]?.speed_accuracy_quadrant || null
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET BATCH PERFORMANCE (Faculty only)
    // ============================================
    router.get('/batch/:batchId', auth.isFaculty, async (req, res, next) => {
        try {
            const { batchId } = req.params;

            // Get batch overall stats
            const statsResult = await pool.query(
                `SELECT 
                    COUNT(DISTINCT student_id) as student_count,
                    AVG(total_score) as avg_score,
                    AVG(overall_accuracy) as avg_accuracy,
                    MAX(total_score) as highest_score
                 FROM analytics
                 WHERE batch_id = $1`,
                [batchId]
            );

            // Get subject-wise performance for batch
            const subjectResult = await pool.query(
                `SELECT 
                    key as subject,
                    AVG(value::numeric) as avg_score
                 FROM analytics,
                 jsonb_each_text(subject_wise_scores)
                 WHERE batch_id = $1
                 GROUP BY key
                 ORDER BY avg_score DESC`,
                [batchId]
            );

            // Get rank distribution
            const rankResult = await pool.query(
                `SELECT 
                    all_india_rank,
                    COUNT(*) as count
                 FROM analytics
                 WHERE batch_id = $1
                 GROUP BY all_india_rank
                 ORDER BY all_india_rank
                 LIMIT 20`,
                [batchId]
            );

            res.json({
                success: true,
                data: {
                    stats: statsResult.rows[0] || {},
                    subjectPerformance: subjectResult.rows || [],
                    rankDistribution: rankResult.rows || []
                }
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};