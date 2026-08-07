// ============================================
// OMR SERVICE - Bubble Detection & Grading
// ============================================

const { query } = require('../config/database');
const logger = require('../utils/logger');

class OMRService {
    
    // ============================================
    // PROCESS OMR SHEET
    // ============================================
    static async processOMR(attemptId, filePath) {
        try {
            console.log(`📄 Processing OMR for attempt: ${attemptId}`);

            // Get attempt details
            const attemptResult = await query(
                'SELECT * FROM attempts WHERE id = $1',
                [attemptId]
            );

            if (attemptResult.rows.length === 0) {
                throw new Error('Attempt not found');
            }

            const attempt = attemptResult.rows[0];

            // Get test details
            const testResult = await query(
                'SELECT * FROM tests WHERE id = $1',
                [attempt.test_id]
            );

            if (testResult.rows.length === 0) {
                throw new Error('Test not found');
            }

            const test = testResult.rows[0];

            // Get questions
            const questionsResult = await query(
                `SELECT q.*, tq.question_order
                 FROM test_questions tq
                 JOIN questions q ON tq.question_id = q.id
                 WHERE tq.test_id = $1
                 ORDER BY tq.question_order`,
                [test.id]
            );

            const questions = questionsResult.rows;

            // Simulate bubble detection (In real world, use OCR/Image Processing API)
            const detectedAnswers = await this.detectBubbles(filePath, questions);

            // Evaluate answers
            const results = await this.evaluateAnswers(detectedAnswers, questions, test.marking_scheme);

            // Update attempt
            await this.updateAttempt(attemptId, results, filePath);

            // Create analytics
            await this.createAnalytics(attempt, results, test);

            return {
                success: true,
                message: 'OMR processed successfully',
                data: {
                    attempt_id: attemptId,
                    detected_answers: detectedAnswers,
                    results: results
                }
            };

        } catch (error) {
            logger.error('OMR processing error:', error);
            throw error;
        }
    }

    // ============================================
    // DETECT BUBBLES (Simulated - Replace with actual API)
    // ============================================
    static async detectBubbles(filePath, questions) {
        console.log(`🔍 Detecting bubbles from: ${filePath}`);

        // In production, you would use:
        // 1. Tesseract.js (open-source OCR)
        // 2. Google Cloud Vision API
        // 3. AWS Rekognition
        // 4. Custom OMR API

        // For demo, generate random answers
        const detectedAnswers = {};

        questions.forEach(q => {
            // Simulate detection with some randomness
            const options = q.options ? Object.keys(q.options) : ['A', 'B', 'C', 'D'];
            const randomIndex = Math.floor(Math.random() * options.length);
            const detected = options[randomIndex];

            // 85% accuracy simulation
            const isCorrect = detected === q.correct_answers[0];
            const confidence = isCorrect ? 0.85 + Math.random() * 0.1 : 0.6 + Math.random() * 0.2;

            detectedAnswers[q.id] = {
                detected: detected,
                confidence: Math.min(confidence, 0.98),
                is_correct: isCorrect
            };
        });

        return detectedAnswers;
    }

    // ============================================
    // EVALUATE ANSWERS
    // ============================================
    static async evaluateAnswers(detectedAnswers, questions, markingScheme) {
        const results = {
            total_correct: 0,
            total_incorrect: 0,
            total_unattempted: 0,
            score_obtained: 0,
            answers: {}
        };

        questions.forEach(q => {
            const detected = detectedAnswers[q.id];
            const userAnswer = detected ? detected.detected : null;
            const isCorrect = detected ? detected.is_correct : false;

            let marks = 0;
            if (userAnswer) {
                if (isCorrect) {
                    marks = markingScheme.correct || q.marks || 4;
                    results.total_correct++;
                } else {
                    marks = markingScheme.incorrect || q.negative_marks || -1;
                    results.total_incorrect++;
                }
            } else {
                results.total_unattempted++;
            }

            results.score_obtained += marks;
            results.answers[q.id] = {
                selected: userAnswer,
                correct: isCorrect,
                marks: marks,
                confidence: detected ? detected.confidence : 0,
                correct_answer: q.correct_answers[0]
            };
        });

        return results;
    }

    // ============================================
    // UPDATE ATTEMPT
    // ============================================
    static async updateAttempt(attemptId, results, filePath) {
        const result = await query(
            `UPDATE attempts SET
                status = 'submitted',
                submitted_at = CURRENT_TIMESTAMP,
                omr_file_path = $1,
                omr_processed = true,
                evaluated_answers = $2,
                score_obtained = $3,
                total_correct = $4,
                total_incorrect = $5,
                total_unattempted = $6,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [
                filePath,
                JSON.stringify(results.answers),
                results.score_obtained,
                results.total_correct,
                results.total_incorrect,
                results.total_unattempted,
                attemptId
            ]
        );

        return result.rows[0];
    }

    // ============================================
    // CREATE ANALYTICS
    // ============================================
    static async createAnalytics(attempt, results, test) {
        // Get student's batch
        const studentResult = await query(
            'SELECT current_batch_id FROM students WHERE id = $1',
            [attempt.student_id]
        );
        const batchId = studentResult.rows[0]?.current_batch_id;

        // Calculate accuracy
        const totalAttempted = results.total_correct + results.total_incorrect;
        const overallAccuracy = totalAttempted > 0 
            ? (results.total_correct / totalAttempted) * 100 
            : 0;

        // Calculate subject-wise scores (simplified)
        const subjectScores = {};

        // Insert analytics
        await query(
            `INSERT INTO analytics (
                student_id, attempt_id, test_id, batch_id,
                total_score, total_marks,
                overall_accuracy,
                calculated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
                attempt.student_id,
                attempt.id,
                attempt.test_id,
                batchId,
                results.score_obtained,
                test.total_marks || 0,
                overallAccuracy
            ]
        );
    }

    // ============================================
    // MANUAL OVERRIDE
    // ============================================
    static async manualOverride(attemptId, questionId, correctAnswer) {
        try {
            // Get attempt
            const attemptResult = await query(
                'SELECT * FROM attempts WHERE id = $1',
                [attemptId]
            );

            if (attemptResult.rows.length === 0) {
                throw new Error('Attempt not found');
            }

            const attempt = attemptResult.rows[0];
            const evaluatedAnswers = attempt.evaluated_answers || {};

            // Update answer
            evaluatedAnswers[questionId] = {
                ...evaluatedAnswers[questionId],
                selected: correctAnswer,
                correct: correctAnswer === evaluatedAnswers[questionId]?.correct_answer
            };

            // Recalculate score
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalUnattempted = 0;
            let scoreObtained = 0;

            Object.values(evaluatedAnswers).forEach(ans => {
                if (ans.selected) {
                    if (ans.correct) {
                        totalCorrect++;
                        scoreObtained += 4;
                    } else {
                        totalIncorrect++;
                        scoreObtained -= 1;
                    }
                } else {
                    totalUnattempted++;
                }
            });

            // Update attempt
            const result = await query(
                `UPDATE attempts SET
                    evaluated_answers = $1,
                    score_obtained = $2,
                    total_correct = $3,
                    total_incorrect = $4,
                    total_unattempted = $5,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6
                 RETURNING *`,
                [
                    JSON.stringify(evaluatedAnswers),
                    scoreObtained,
                    totalCorrect,
                    totalIncorrect,
                    totalUnattempted,
                    attemptId
                ]
            );

            // Update analytics
            await query(
                `UPDATE analytics SET
                    total_score = $1,
                    overall_accuracy = $2,
                    calculated_at = CURRENT_TIMESTAMP
                 WHERE attempt_id = $3`,
                [
                    scoreObtained,
                    (totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted)) * 100 || 0,
                    attemptId
                ]
            );

            return {
                success: true,
                message: 'Manual override successful',
                data: result.rows[0]
            };

        } catch (error) {
            logger.error('Manual override error:', error);
            throw error;
        }
    }
}

module.exports = OMRService;