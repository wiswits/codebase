// ============================================
// DPP ROUTES
// ============================================

const authMiddleware = require('../middleware/auth');

module.exports = function(pool) {
    const router = require('express').Router();
    const auth = authMiddleware(pool);

    // All routes require authentication
    router.use(auth.verifyToken);

    // ============================================
    // GENERATE DPP FOR STUDENT
    // ============================================
    router.post('/generate', async (req, res, next) => {
        try {
            const { studentId, count = 12, difficulty = 'mixed' } = req.body;

            // Get student's error book questions (in progress)
            const errorQuestions = await pool.query(
                `SELECT eb.id as error_id, q.*
                 FROM error_book eb
                 JOIN questions q ON eb.question_id = q.id
                 WHERE eb.student_id = $1 
                   AND eb.is_mastered = false 
                   AND eb.in_active_deck = true
                 ORDER BY RANDOM()
                 LIMIT $2`,
                [studentId, count]
            );

            let questionIds = errorQuestions.rows.map(q => q.id);
            let selectedQuestions = errorQuestions.rows;

            // If not enough questions from error book, add random questions
            if (questionIds.length < count) {
                const remaining = count - questionIds.length;
                const extraQuestions = await pool.query(
                    `SELECT * FROM questions
                     WHERE id NOT IN (SELECT unnest($1::int[]))
                     ORDER BY RANDOM()
                     LIMIT $2`,
                    [questionIds.length > 0 ? questionIds : [0], remaining]
                );
                selectedQuestions = [...selectedQuestions, ...extraQuestions.rows];
                questionIds = selectedQuestions.map(q => q.id);
            }

            // Create DPP
            const dppResult = await pool.query(
                `INSERT INTO dpps (
                    student_id, for_date, questions, status, generated_by
                ) VALUES ($1, CURRENT_DATE, $2, 'pending', 'auto')
                RETURNING *`,
                [studentId, JSON.stringify(questionIds)]
            );

            // Update streak
            await pool.query(
                `UPDATE dpps SET streak_count = streak_count + 1
                 WHERE student_id = $1 AND for_date = CURRENT_DATE`,
                [studentId]
            );

            res.json({
                success: true,
                message: 'DPP generated successfully',
                data: {
                    dpp: dppResult.rows[0],
                    questions: selectedQuestions.map(q => ({
                        id: q.id,
                        question_text: q.question_text,
                        options: q.options,
                        type: q.question_type,
                        subject: q.subject,
                        difficulty: q.difficulty
                    }))
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET TODAY'S DPP
    // ============================================
    router.get('/today/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;

            const result = await pool.query(
                `SELECT * FROM dpps
                 WHERE student_id = $1 AND for_date = CURRENT_DATE
                 LIMIT 1`,
                [studentId]
            );

            if (result.rows.length === 0) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No DPP available for today'
                });
            }

            const dpp = result.rows[0];

            // Get questions
            const questionIds = dpp.questions || [];
            let questions = [];
            if (questionIds.length > 0) {
                const questionsResult = await pool.query(
                    `SELECT * FROM questions WHERE id = ANY($1::int[])`,
                    [questionIds]
                );
                questions = questionsResult.rows;
            }

            res.json({
                success: true,
                data: {
                    ...dpp,
                    questions: questions
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // SUBMIT DPP
    // ============================================
    router.post('/submit', async (req, res, next) => {
        try {
            const { dpp_id, answers } = req.body;

            const dppResult = await pool.query(
                'SELECT * FROM dpps WHERE id = $1 AND status = $2',
                [dpp_id, 'pending']
            );

            if (dppResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'DPP not found or already submitted'
                });
            }

            const dpp = dppResult.rows[0];
            const questionIds = dpp.questions || [];

            // Evaluate answers
            let totalCorrect = 0;
            let totalIncorrect = 0;
            const evaluatedAnswers = {};

            for (const qId of questionIds) {
                const questionResult = await pool.query(
                    'SELECT correct_answers FROM questions WHERE id = $1',
                    [qId]
                );

                if (questionResult.rows.length > 0) {
                    const correct = questionResult.rows[0].correct_answers;
                    const userAnswer = answers[qId];
                    const isCorrect = userAnswer && 
                        JSON.stringify(userAnswer) === JSON.stringify(correct);

                    if (isCorrect) {
                        totalCorrect++;
                    } else {
                        totalIncorrect++;
                    }

                    evaluatedAnswers[qId] = {
                        selected: userAnswer || null,
                        correct: isCorrect,
                        correct_answer: correct
                    };
                }
            }

            const score = (totalCorrect / (totalCorrect + totalIncorrect)) * 100;

            // Update DPP
            const result = await pool.query(
                `UPDATE dpps SET
                    status = 'submitted',
                    submitted_at = CURRENT_TIMESTAMP,
                    answers = $1,
                    score_obtained = $2,
                    total_correct = $3,
                    total_incorrect = $4,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 RETURNING *`,
                [evaluatedAnswers, score, totalCorrect, totalIncorrect, dpp_id]
            );

            // Update streak in error book for mastered questions
            // (questions answered correctly multiple times)

            res.json({
                success: true,
                message: 'DPP submitted successfully',
                data: {
                    dpp: result.rows[0],
                    score: score,
                    total_correct: totalCorrect,
                    total_incorrect: totalIncorrect
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // ============================================
    // GET DPP STREAK
    // ============================================
    router.get('/streak/:studentId', async (req, res, next) => {
        try {
            const { studentId } = req.params;

            const result = await pool.query(
                `SELECT 
                    streak_count,
                    MAX(for_date) as last_submission_date,
                    COUNT(*) as total_submissions
                 FROM dpps
                 WHERE student_id = $1 AND status = 'submitted'
                 GROUP BY streak_count
                 ORDER BY streak_count DESC
                 LIMIT 1`,
                [studentId]
            );

            // Get streak history (last 7 days)
            const historyResult = await pool.query(
                `SELECT 
                    for_date,
                    status,
                    score_obtained
                 FROM dpps
                 WHERE student_id = $1
                 ORDER BY for_date DESC
                 LIMIT 7`,
                [studentId]
            );

            res.json({
                success: true,
                data: {
                    currentStreak: result.rows[0]?.streak_count || 0,
                    lastSubmission: result.rows[0]?.last_submission_date || null,
                    totalSubmissions: result.rows[0]?.total_submissions || 0,
                    history: historyResult.rows || []
                }
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};