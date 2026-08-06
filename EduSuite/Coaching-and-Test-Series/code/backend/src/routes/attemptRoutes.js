// ============================================
// ATTEMPT ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // START TEST ATTEMPT
    // ============================================
    router.post('/start', async (req, res, next) => {
        try {
            const { test_id } = req.body;
            const studentId = req.userId; // Assuming user is a student

            // Check if test exists and is published
            const testResult = await pool.query(
                'SELECT * FROM tests WHERE id = $1 AND is_published = true',
                [test_id]
            );

            if (testResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Test not found or not published'
                });
            }

            const test = testResult.rows[0];

            // Check if student already attempted
            const existingAttempt = await pool.query(
                'SELECT * FROM attempts WHERE student_id = $1 AND test_id = $2',
                [studentId, test_id]
            );

            if (existingAttempt.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'You have already attempted this test'
                });
            }

            // Get student ID from user
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student profile not found'
                });
            }

            const student_id = studentResult.rows[0].id;

            // Create attempt
            const attemptResult = await pool.query(
                `INSERT INTO attempts (
                    student_id, test_id, status, start_time
                ) VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP)
                RETURNING *`,
                [student_id, test_id]
            );

            // Get questions for this test
            const questionsResult = await pool.query(
                `SELECT q.*, tq.question_order
                 FROM test_questions tq
                 JOIN questions q ON tq.question_id = q.id
                 WHERE tq.test_id = $1
                 ORDER BY tq.question_order`,
                [test_id]
            );

            res.json({
                success: true,
                data: {
                    attempt: attemptResult.rows[0],
                    test: {
                        title: test.title,
                        duration_minutes: test.duration_minutes,
                        total_questions: questionsResult.rows.length,
                        marking_scheme: test.marking_scheme
                    },
                    questions: questionsResult.rows.map(q => ({
                        id: q.id,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        options: q.options,
                        marks: q.marks,
                        question_order: q.question_order
                    }))
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // SAVE ANSWER (Auto-save during test)
    // ============================================
    router.post('/save-answer', async (req, res, next) => {
        try {
            const { attempt_id, question_id, answer } = req.body;

            // Get attempt
            const attemptResult = await pool.query(
                'SELECT * FROM attempts WHERE id = $1 AND status = $2',
                [attempt_id, 'in_progress']
            );

            if (attemptResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Attempt not found or already submitted'
                });
            }

            const attempt = attemptResult.rows[0];

            // Update raw answers
            let rawAnswers = attempt.raw_answers || {};
            rawAnswers[question_id] = answer;

            await pool.query(
                'UPDATE attempts SET raw_answers = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [rawAnswers, attempt_id]
            );

            res.json({
                success: true,
                message: 'Answer saved successfully'
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // SUBMIT TEST
    // ============================================
    router.post('/submit', async (req, res, next) => {
        try {
            const { attempt_id } = req.body;

            // Get attempt with test details
            const attemptResult = await pool.query(
                `SELECT a.*, t.marking_scheme, t.total_marks
                 FROM attempts a
                 JOIN tests t ON a.test_id = t.id
                 WHERE a.id = $1 AND a.status = 'in_progress'`,
                [attempt_id]
            );

            if (attemptResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Attempt not found or already submitted'
                });
            }

            const attempt = attemptResult.rows[0];
            const markingScheme = attempt.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 };

            // Get all questions for this test
            const questionsResult = await pool.query(
                `SELECT q.*, tq.question_order
                 FROM test_questions tq
                 JOIN questions q ON tq.question_id = q.id
                 WHERE tq.test_id = $1`,
                [attempt.test_id]
            );

            const questions = questionsResult.rows;
            const rawAnswers = attempt.raw_answers || {};
            const evaluatedAnswers = {};
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalUnattempted = 0;
            let scoreObtained = 0;
            let incorrectQuestionIds = [];

            // Evaluate each question
            questions.forEach(q => {
                const userAnswer = rawAnswers[q.id];
                const correctAnswers = q.correct_answers;
                const isCorrect = userAnswer && 
                    JSON.stringify(userAnswer) === JSON.stringify(correctAnswers);

                let marks = 0;
                if (userAnswer) {
                    if (isCorrect) {
                        marks = markingScheme.correct || q.marks || 4;
                        totalCorrect++;
                    } else {
                        marks = markingScheme.incorrect || q.negative_marks || -1;
                        totalIncorrect++;
                        incorrectQuestionIds.push(q.id);
                    }
                } else {
                    totalUnattempted++;
                }

                scoreObtained += marks;

                evaluatedAnswers[q.id] = {
                    selected: userAnswer || null,
                    correct: isCorrect,
                    marks: marks,
                    correct_answer: correctAnswers
                };
            });

            // Update attempt
            const result = await pool.query(
                `UPDATE attempts SET
                    status = 'submitted',
                    end_time = CURRENT_TIMESTAMP,
                    submitted_at = CURRENT_TIMESTAMP,
                    time_taken_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))::INTEGER,
                    evaluated_answers = $1,
                    score_obtained = $2,
                    total_correct = $3,
                    total_incorrect = $4,
                    total_unattempted = $5,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6
                 RETURNING *`,
                [evaluatedAnswers, scoreObtained, totalCorrect, totalIncorrect, totalUnattempted, attempt_id]
            );

            // Queue analytics calculation
            // This should be processed asynchronously
            // For now, we'll calculate it here

            // Start transaction for analytics
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Get batch info
                const batchResult = await client.query(
                    'SELECT current_batch_id FROM students WHERE id = $1',
                    [attempt.student_id]
                );
                const batchId = batchResult.rows[0]?.current_batch_id;

                // Insert analytics
                await client.query(
                    `INSERT INTO analytics (
                        student_id, attempt_id, test_id, batch_id,
                        total_score, total_marks,
                        subject_wise_scores, subject_wise_accuracy,
                        overall_accuracy,
                        incorrect_question_ids,
                        calculated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
                    [
                        attempt.student_id,
                        attempt_id,
                        attempt.test_id,
                        batchId,
                        scoreObtained,
                        attempt.total_marks || 0,
                        {}, // subject_wise_scores - to be calculated
                        {}, // subject_wise_accuracy - to be calculated
                        (totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted)) * 100 || 0,
                        incorrectQuestionIds
                    ]
                );

                // Insert into error book for each wrong question
                if (incorrectQuestionIds.length > 0) {
                    const errorValues = incorrectQuestionIds.map(qId => {
                        return `($1, $2, $3, CURRENT_TIMESTAMP)`;
                    }).join(',');

                    const errorParams = [attempt.student_id, attempt_id];
                    errorParams.push(...incorrectQuestionIds);

                    await client.query(
                        `INSERT INTO error_book (student_id, attempt_id, question_id, added_at)
                         VALUES ${errorValues}`,
                        errorParams
                    );
                }

                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

            res.json({
                success: true,
                message: 'Test submitted successfully',
                data: {
                    attempt: result.rows[0],
                    score_obtained: scoreObtained,
                    total_correct: totalCorrect,
                    total_incorrect: totalIncorrect,
                    total_unattempted: totalUnattempted,
                    incorrect_questions: incorrectQuestionIds
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET ATTEMPT DETAILS
    // ============================================
    router.get('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT a.*, t.title as test_title, t.type as test_type,
                        t.marking_scheme, t.duration_minutes,
                        s.student_code, u.first_name, u.last_name
                 FROM attempts a
                 JOIN tests t ON a.test_id = t.id
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE a.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Attempt not found'
                });
            }

            // Get analytics if available
            const analyticsResult = await pool.query(
                'SELECT * FROM analytics WHERE attempt_id = $1',
                [id]
            );

            const attempt = result.rows[0];
            attempt.analytics = analyticsResult.rows[0] || null;

            res.json({
                success: true,
                data: attempt
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};