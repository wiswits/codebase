// ============================================
// SEED: REAL TEST DATA
// ============================================

const { query } = require('../src/config/database');

module.exports = async () => {
    console.log('🌱 Seeding real test data...');

    // Get student IDs
    const studentsResult = await query(
        'SELECT id FROM students LIMIT 2'
    );
    const studentIds = studentsResult.rows.map(r => r.id);

    if (studentIds.length === 0) {
        console.log('⚠️ No students found, skipping test data');
        return;
    }

    // ============================================
    // 1. CREATE SAMPLE QUESTIONS
    // ============================================
    console.log('📝 Creating sample questions...');

    const questions = [
        {
            question_text: 'What is the value of acceleration due to gravity on Earth?',
            question_type: 'mcq',
            options: JSON.stringify({ A: '9.8 m/s²', B: '10 m/s²', C: '8.9 m/s²', D: '9.0 m/s²' }),
            correct_answers: JSON.stringify(['A']),
            subject: 'Physics',
            chapter: 'Mechanics',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'Which of the following is a noble gas?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'Oxygen', B: 'Nitrogen', C: 'Helium', D: 'Carbon' }),
            correct_answers: JSON.stringify(['C']),
            subject: 'Chemistry',
            chapter: 'Periodic Table',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'What is the derivative of x²?',
            question_type: 'mcq',
            options: JSON.stringify({ A: '2x', B: 'x²', C: '2x²', D: 'x' }),
            correct_answers: JSON.stringify(['A']),
            subject: 'Mathematics',
            chapter: 'Calculus',
            difficulty: 'medium',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'Which organelle is known as the powerhouse of the cell?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'Nucleus', B: 'Ribosome', C: 'Mitochondria', D: 'Golgi' }),
            correct_answers: JSON.stringify(['C']),
            subject: 'Biology',
            chapter: 'Cell Biology',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'What is the SI unit of force?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'Newton', B: 'Joule', C: 'Watt', D: 'Pascal' }),
            correct_answers: JSON.stringify(['A']),
            subject: 'Physics',
            chapter: 'Mechanics',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'Which of the following is NOT a type of chemical bond?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'Ionic', B: 'Covalent', C: 'Hydrogen', D: 'Nuclear' }),
            correct_answers: JSON.stringify(['D']),
            subject: 'Chemistry',
            chapter: 'Chemical Bonding',
            difficulty: 'medium',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'What is the value of π (pi) approximately?',
            question_type: 'nat',
            options: JSON.stringify({}),
            correct_answers: JSON.stringify(['3.14']),
            subject: 'Mathematics',
            chapter: 'Geometry',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'Which blood type is the universal donor?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'A+', B: 'AB+', C: 'O-', D: 'B-' }),
            correct_answers: JSON.stringify(['C']),
            subject: 'Biology',
            chapter: 'Human Physiology',
            difficulty: 'medium',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'What is the speed of light in vacuum?',
            question_type: 'mcq',
            options: JSON.stringify({ A: '3×10⁸ m/s', B: '3×10⁶ m/s', C: '3×10¹⁰ m/s', D: '3×10⁴ m/s' }),
            correct_answers: JSON.stringify(['A']),
            subject: 'Physics',
            chapter: 'Optics',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
        {
            question_text: 'Which vitamin is produced by sunlight?',
            question_type: 'mcq',
            options: JSON.stringify({ A: 'Vitamin A', B: 'Vitamin B', C: 'Vitamin C', D: 'Vitamin D' }),
            correct_answers: JSON.stringify(['D']),
            subject: 'Biology',
            chapter: 'Biochemistry',
            difficulty: 'easy',
            marks: 4,
            negative_marks: 1,
        },
    ];

    let questionIds = [];
    for (const q of questions) {
        const result = await query(
            `INSERT INTO questions (
                question_text, question_type, options, correct_answers,
                subject, chapter, difficulty, marks, negative_marks,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id`,
            [q.question_text, q.question_type, q.options, q.correct_answers,
             q.subject, q.chapter, q.difficulty, q.marks, q.negative_marks]
        );
        questionIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${questionIds.length} sample questions`);

    // ============================================
    // 2. CREATE A TEST
    // ============================================
    console.log('📝 Creating sample test...');

    // Get faculty ID
    const facultyResult = await query(
        'SELECT id FROM faculty LIMIT 1'
    );
    const facultyId = facultyResult.rows[0]?.id || 1;

    const testResult = await query(
        `INSERT INTO tests (
            title, type, mode, duration_minutes, total_marks,
            marking_scheme, subjects, syllabus, instructions,
            created_by, is_published, published_at,
            created_at, updated_at
        ) VALUES (
            'AITS 2026 - Physics Mock Test',
            'aits',
            'online',
            180,
            40,
            '{"correct": 4, "incorrect": -1, "unattempted": 0}',
            '["Physics", "Chemistry", "Mathematics"]',
            'Complete syllabus for JEE Advanced',
            'Follow the instructions carefully. All questions are compulsory.',
            $1,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id`,
        [facultyId]
    );

    const testId = testResult.rows[0].id;
    console.log(`✅ Test created with ID: ${testId}`);

    // ============================================
    // 3. ADD QUESTIONS TO TEST
    // ============================================
    console.log('📝 Adding questions to test...');

    for (let i = 0; i < questionIds.length; i++) {
        await query(
            `INSERT INTO test_questions (test_id, question_id, question_order)
             VALUES ($1, $2, $3)`,
            [testId, questionIds[i], i]
        );
    }
    console.log(`✅ Added ${questionIds.length} questions to test`);

    // ============================================
    // 4. CREATE SAMPLE ATTEMPTS
    // ============================================
    console.log('📝 Creating sample attempts...');

    for (const studentId of studentIds) {
        // Create an attempt
        const attemptResult = await query(
            `INSERT INTO attempts (
                student_id, test_id, status, start_time, end_time, submitted_at,
                time_taken_seconds, score_obtained,
                total_correct, total_incorrect, total_unattempted,
                created_at, updated_at
            ) VALUES (
                $1, $2, 'submitted',
                CURRENT_TIMESTAMP - INTERVAL '2 hours',
                CURRENT_TIMESTAMP - INTERVAL '30 minutes',
                CURRENT_TIMESTAMP - INTERVAL '30 minutes',
                5400,
                28,
                7, 3, 0,
                CURRENT_TIMESTAMP - INTERVAL '2 hours',
                CURRENT_TIMESTAMP - INTERVAL '30 minutes'
            ) RETURNING id`,
            [studentId, testId]
        );

        const attemptId = attemptResult.rows[0].id;

        // Create analytics
        await query(
            `INSERT INTO analytics (
                student_id, attempt_id, test_id, batch_id,
                total_score, total_marks,
                overall_accuracy,
                incorrect_question_ids,
                all_india_rank,
                all_india_percentile,
                calculated_at
            ) VALUES (
                $1, $2, $3, NULL,
                28, 40,
                70,
                '[]',
                42,
                85.5,
                CURRENT_TIMESTAMP
            )`,
            [studentId, attemptId, testId]
        );

        console.log(`✅ Attempt created for student ${studentId}`);
    }

    console.log('🎉 Test data seeding completed successfully!');
};