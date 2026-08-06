// ============================================
// SEED: REAL TEST DATA WITH QUESTIONS
// ============================================

require('dotenv').config();
const { pool } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function seedTestData() {
    console.log('🌱 Seeding real test data...\n');

    try {
        // ============================================
        // 1. CHECK IF STUDENTS ALREADY EXIST
        // ============================================
        console.log('📝 Checking existing students...');
        
        const existingStudents = await pool.query(
            'SELECT id, user_id FROM students LIMIT 1'
        );

        let studentIds = [];

        if (existingStudents.rows.length > 0) {
            console.log('⚠️ Students already exist, skipping student creation');
            
            // Get existing student IDs
            const allStudents = await pool.query('SELECT id FROM students');
            studentIds = allStudents.rows.map(row => row.id);
            
            console.log(`✅ Found ${studentIds.length} existing students`);
        } else {
            // ============================================
            // 2. CREATE STUDENTS (Only if none exist)
            // ============================================
            console.log('📝 Creating students...');

            for (let i = 1; i <= 10; i++) {
                const hash = await bcrypt.hash(`password${i}`, 10);
                
                // Check if user already exists
                const userCheck = await pool.query(
                    'SELECT id FROM users WHERE email = $1',
                    [`student${i}@test.com`]
                );

                let userId;
                if (userCheck.rows.length > 0) {
                    userId = userCheck.rows[0].id;
                    console.log(`⚠️ User student${i}@test.com already exists, skipping`);
                } else {
                    const userResult = await pool.query(
                        `INSERT INTO users (email, password_hash, role, first_name, last_name)
                         VALUES ($1, $2, 'student', $3, $4)
                         RETURNING id`,
                        [`student${i}@test.com`, hash, `Student${i}`, `Test${i}`]
                    );
                    userId = userResult.rows[0].id;
                }

                // Check if student profile already exists
                const studentCheck = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [userId]
                );

                if (studentCheck.rows.length > 0) {
                    studentIds.push(studentCheck.rows[0].id);
                } else {
                    const studentResult = await pool.query(
                        `INSERT INTO students (user_id, student_code, status)
                         VALUES ($1, $2, 'active')
                         RETURNING id`,
                        [userId, `STU-${String(i).padStart(3, '0')}`]
                    );
                    studentIds.push(studentResult.rows[0].id);
                }
            }
            console.log(`✅ Created/Found ${studentIds.length} students`);
        }

        // ============================================
        // 3. CREATE QUESTIONS (Skip if exist)
        // ============================================
        console.log('📝 Checking existing questions...');
        
        const existingQuestions = await pool.query(
            'SELECT COUNT(*) FROM questions'
        );

        let questionIds = [];

        if (parseInt(existingQuestions.rows[0].count) > 0) {
            console.log('⚠️ Questions already exist, skipping question creation');
            const allQuestions = await pool.query('SELECT id FROM questions');
            questionIds = allQuestions.rows.map(row => row.id);
            console.log(`✅ Found ${questionIds.length} existing questions`);
        } else {
            console.log('📝 Creating questions...');
            
            const questions = [
                {
                    text: 'What is the value of acceleration due to gravity on Earth?',
                    type: 'mcq',
                    options: JSON.stringify({ A: '9.8 m/s²', B: '10 m/s²', C: '8.9 m/s²', D: '9.0 m/s²' }),
                    correct: JSON.stringify(['A']),
                    subject: 'Physics',
                    chapter: 'Mechanics',
                    difficulty: 'easy'
                },
                {
                    text: 'Which of the following is a noble gas?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'Oxygen', B: 'Nitrogen', C: 'Helium', D: 'Carbon' }),
                    correct: JSON.stringify(['C']),
                    subject: 'Chemistry',
                    chapter: 'Periodic Table',
                    difficulty: 'easy'
                },
                {
                    text: 'What is the derivative of x²?',
                    type: 'mcq',
                    options: JSON.stringify({ A: '2x', B: 'x²', C: '2x²', D: 'x' }),
                    correct: JSON.stringify(['A']),
                    subject: 'Mathematics',
                    chapter: 'Calculus',
                    difficulty: 'medium'
                },
                {
                    text: 'Which organelle is known as the powerhouse of the cell?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'Nucleus', B: 'Ribosome', C: 'Mitochondria', D: 'Golgi' }),
                    correct: JSON.stringify(['C']),
                    subject: 'Biology',
                    chapter: 'Cell Biology',
                    difficulty: 'easy'
                },
                {
                    text: 'What is the SI unit of force?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'Newton', B: 'Joule', C: 'Watt', D: 'Pascal' }),
                    correct: JSON.stringify(['A']),
                    subject: 'Physics',
                    chapter: 'Mechanics',
                    difficulty: 'easy'
                },
                {
                    text: 'Which of the following is NOT a type of chemical bond?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'Ionic', B: 'Covalent', C: 'Hydrogen', D: 'Nuclear' }),
                    correct: JSON.stringify(['D']),
                    subject: 'Chemistry',
                    chapter: 'Chemical Bonding',
                    difficulty: 'medium'
                },
                {
                    text: 'What is the approximate value of π (pi)?',
                    type: 'nat',
                    options: JSON.stringify({}),
                    correct: JSON.stringify(['3.14']),
                    subject: 'Mathematics',
                    chapter: 'Geometry',
                    difficulty: 'easy'
                },
                {
                    text: 'Which blood type is the universal donor?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'A+', B: 'AB+', C: 'O-', D: 'B-' }),
                    correct: JSON.stringify(['C']),
                    subject: 'Biology',
                    chapter: 'Human Physiology',
                    difficulty: 'medium'
                },
                {
                    text: 'What is the speed of light in vacuum?',
                    type: 'mcq',
                    options: JSON.stringify({ A: '3×10⁸ m/s', B: '3×10⁶ m/s', C: '3×10¹⁰ m/s', D: '3×10⁴ m/s' }),
                    correct: JSON.stringify(['A']),
                    subject: 'Physics',
                    chapter: 'Optics',
                    difficulty: 'easy'
                },
                {
                    text: 'Which vitamin is produced by sunlight?',
                    type: 'mcq',
                    options: JSON.stringify({ A: 'Vitamin A', B: 'Vitamin B', C: 'Vitamin C', D: 'Vitamin D' }),
                    correct: JSON.stringify(['D']),
                    subject: 'Biology',
                    chapter: 'Biochemistry',
                    difficulty: 'easy'
                }
            ];

            for (const q of questions) {
                const result = await pool.query(
                    `INSERT INTO questions (
                        question_text, question_type, options, correct_answers,
                        subject, chapter, difficulty,
                        marks, negative_marks,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id`,
                    [q.text, q.type, q.options, q.correct,
                     q.subject, q.chapter, q.difficulty,
                     4, 1]
                );
                questionIds.push(result.rows[0].id);
            }
            console.log(`✅ Created ${questionIds.length} questions`);
        }

        // ============================================
        // 4. CREATE TEST (Only if no test exists)
        // ============================================
        console.log('📝 Checking existing tests...');
        
        const existingTests = await pool.query(
            'SELECT COUNT(*) FROM tests'
        );

        let testId;

        if (parseInt(existingTests.rows[0].count) > 0) {
            console.log('⚠️ Tests already exist, skipping test creation');
            const testResult = await pool.query('SELECT id FROM tests LIMIT 1');
            testId = testResult.rows[0].id;
            console.log(`✅ Found existing test ID: ${testId}`);
        } else {
            console.log('📝 Creating test...');
            
            const subjectsArray = '{Physics,Chemistry,Mathematics}';

            const testResult = await pool.query(
                `INSERT INTO tests (
                    title, type, mode, duration_minutes, total_marks,
                    marking_scheme, subjects, syllabus, instructions,
                    is_published, published_at,
                    created_at, updated_at
                ) VALUES (
                    'AITS 2026 - Physics Mock Test',
                    'aits',
                    'online',
                    180,
                    40,
                    '{"correct": 4, "incorrect": -1, "unattempted": 0}',
                    $1,
                    'Complete syllabus for JEE Advanced',
                    'Follow the instructions carefully. All questions are compulsory.',
                    true,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                ) RETURNING id`,
                [subjectsArray]
            );

            testId = testResult.rows[0].id;
            console.log(`✅ Test created with ID: ${testId}`);
        }

        // ============================================
        // 5. ADD QUESTIONS TO TEST (Skip if exist)
        // ============================================
        console.log('📝 Adding questions to test...');
        
        const existingTestQuestions = await pool.query(
            'SELECT COUNT(*) FROM test_questions WHERE test_id = $1',
            [testId]
        );

        if (parseInt(existingTestQuestions.rows[0].count) > 0) {
            console.log('⚠️ Questions already added to test, skipping');
        } else {
            for (let i = 0; i < questionIds.length; i++) {
                await pool.query(
                    `INSERT INTO test_questions (test_id, question_id, question_order)
                     VALUES ($1, $2, $3)`,
                    [testId, questionIds[i], i]
                );
            }
            console.log(`✅ Added ${questionIds.length} questions to test`);
        }

        // ============================================
        // 6. CREATE ATTEMPTS (Skip if exist)
        // ============================================
        console.log('📝 Creating attempts for students...');
        
        for (let i = 0; i < studentIds.length; i++) {
            const studentId = studentIds[i];
            
            // Check if attempt already exists
            const existingAttempt = await pool.query(
                'SELECT id FROM attempts WHERE student_id = $1 AND test_id = $2',
                [studentId, testId]
            );

            if (existingAttempt.rows.length > 0) {
                console.log(`⚠️ Attempt already exists for student ${i + 1}, skipping`);
                continue;
            }

            const score = Math.floor(Math.random() * 30) + 10;
            const correct = Math.floor(score / 4);
            const incorrect = Math.floor(Math.random() * 3) + 1;
            const unattempted = 10 - correct - incorrect;

            await pool.query(
                `INSERT INTO attempts (
                    student_id, test_id, status,
                    start_time, end_time, submitted_at,
                    time_taken_seconds,
                    score_obtained,
                    total_correct, total_incorrect, total_unattempted,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, 'submitted',
                    CURRENT_TIMESTAMP - INTERVAL '2 hours',
                    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
                    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
                    5400,
                    $3,
                    $4, $5, $6,
                    CURRENT_TIMESTAMP - INTERVAL '2 hours',
                    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
                )`,
                [studentId, testId, score, correct, incorrect, unattempted]
            );
            
            console.log(`✅ Attempt created for student ${i + 1}`);
        }

        console.log('\n🎉 Test data seeded successfully!');
        console.log(`📝 ${questionIds.length} questions available`);
        console.log(`📚 1 test available`);
        console.log(`👥 ${studentIds.length} students with attempts`);

    } catch (error) {
        console.error('❌ Error seeding test data:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

seedTestData();