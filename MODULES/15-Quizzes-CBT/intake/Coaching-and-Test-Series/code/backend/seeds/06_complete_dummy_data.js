// ============================================
// COMPLETE DUMMY DATA - ALL TABLES
// ============================================

require('dotenv').config();
const { pool } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function seedCompleteDummyData() {
    console.log('🌱 Seeding COMPLETE dummy data...\n');

    try {
        // ============================================
        // 1. CREATE USERS (Students + Faculty + Admin)
        // ============================================
        console.log('📝 Creating users...');

        const users = [];

        // Admin
        const adminHash = await bcrypt.hash('admin123', 10);
        const adminResult = await pool.query(
            `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
             VALUES ($1, $2, 'admin', 'Admin', 'User', true)
             ON CONFLICT (email) DO NOTHING
             RETURNING id, email, role`,
            ['admin@edutech.com', adminHash]
        );
        if (adminResult.rows.length > 0) {
            users.push(adminResult.rows[0]);
            console.log(`✅ Admin created: admin@edutech.com`);
        }

        // Faculty
        const facultyData = [
            { email: 'dr.sharma@edutech.com', name: 'Dr. Sharma', subjects: ['Physics', 'Mathematics'] },
            { email: 'dr.mehta@edutech.com', name: 'Dr. Mehta', subjects: ['Chemistry', 'Biology'] },
            { email: 'prof.verma@edutech.com', name: 'Prof. Verma', subjects: ['Mathematics', 'Physics'] }
        ];

        const facultyIds = [];
        for (const f of facultyData) {
            const hash = await bcrypt.hash('password123', 10);
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
                 VALUES ($1, $2, 'faculty', $3, '', true)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id, email`,
                [f.email, hash, f.name.split(' ')[0]]
            );
            if (result.rows.length > 0) {
                const facultyResult = await pool.query(
                    `INSERT INTO faculty (user_id, faculty_code, subjects, specialization, hire_date, is_active)
                     VALUES ($1, $2, $3, $4, CURRENT_DATE, true)
                     ON CONFLICT (faculty_code) DO NOTHING
                     RETURNING id`,
                    [result.rows[0].id, `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`, f.subjects, f.subjects[0]]
                );
                if (facultyResult.rows.length > 0) {
                    facultyIds.push(facultyResult.rows[0].id);
                    console.log(`✅ Faculty created: ${f.email}`);
                }
            }
        }

        // Students
        const studentNames = [
            'Rahul Kumar', 'Priya Mehta', 'Amit Singh', 'Sneha Reddy', 'Vikram Patel',
            'Neha Gupta', 'Arjun Nair', 'Kavya Sharma', 'Rohan Joshi', 'Ananya Iyer'
        ];

        const studentIds = [];
        for (let i = 0; i < studentNames.length; i++) {
            const nameParts = studentNames[i].split(' ');
            const email = `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@edutech.com`;
            const hash = await bcrypt.hash('password123', 10);

            const result = await pool.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
                 VALUES ($1, $2, 'student', $3, $4, true)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [email, hash, nameParts[0], nameParts[1]]
            );

            if (result.rows.length > 0) {
                const studentResult = await pool.query(
                    `INSERT INTO students (user_id, student_code, dob, gender, status, enrollment_date)
                     VALUES ($1, $2, $3, $4, 'active', CURRENT_DATE)
                     ON CONFLICT (student_code) DO NOTHING
                     RETURNING id`,
                    [result.rows[0].id, `STU-${String(i + 1).padStart(3, '0')}`, '2000-01-01', i % 2 === 0 ? 'M' : 'F']
                );
                if (studentResult.rows.length > 0) {
                    studentIds.push(studentResult.rows[0].id);
                }
            }
        }
        console.log(`✅ ${studentIds.length} students created`);

        // ============================================
        // 2. CREATE BATCHES
        // ============================================
        console.log('📝 Creating batches...');

        const batchData = [
            { name: 'Alpha', code: 'ALPHA-2026', type: 'alpha', target_exam: 'JEE' },
            { name: 'Beta', code: 'BETA-2026', type: 'beta', target_exam: 'JEE' },
            { name: 'Gamma', code: 'GAMMA-2026', type: 'gamma', target_exam: 'JEE' }
        ];

        const batchIds = [];
        for (const b of batchData) {
            const result = await pool.query(
                `INSERT INTO batches (name, code, type, target_exam, academic_year, is_active)
                 VALUES ($1, $2, $3, $4, '2026-27', true)
                 ON CONFLICT (code) DO NOTHING
                 RETURNING id`,
                [b.name, b.code, b.type, b.target_exam]
            );
            if (result.rows.length > 0) {
                batchIds.push(result.rows[0].id);
            }
        }
        console.log(`✅ ${batchIds.length} batches created`);

        // Assign students to batches
        for (let i = 0; i < studentIds.length; i++) {
            const batchIndex = Math.min(Math.floor(i / 3), batchIds.length - 1);
            await pool.query(
                `INSERT INTO batch_students (student_id, batch_id, joined_at, is_current)
                 VALUES ($1, $2, CURRENT_DATE, true)
                 ON CONFLICT (student_id, batch_id, joined_at) DO NOTHING`,
                [studentIds[i], batchIds[batchIndex]]
            );
            await pool.query(
                'UPDATE students SET current_batch_id = $1 WHERE id = $2',
                [batchIds[batchIndex], studentIds[i]]
            );
        }
        console.log(`✅ Students assigned to batches`);

        // ============================================
        // 3. CREATE QUESTIONS
        // ============================================
        console.log('📝 Creating questions...');

        const questions = [
            // Physics
            { text: 'What is the value of acceleration due to gravity on Earth?', type: 'mcq', options: JSON.stringify({ A: '9.8 m/s²', B: '10 m/s²', C: '8.9 m/s²', D: '9.0 m/s²' }), correct: JSON.stringify(['A']), subject: 'Physics', chapter: 'Mechanics', difficulty: 'easy' },
            { text: 'What is the SI unit of force?', type: 'mcq', options: JSON.stringify({ A: 'Newton', B: 'Joule', C: 'Watt', D: 'Pascal' }), correct: JSON.stringify(['A']), subject: 'Physics', chapter: 'Mechanics', difficulty: 'easy' },
            { text: 'What is the speed of light in vacuum?', type: 'mcq', options: JSON.stringify({ A: '3×10⁸ m/s', B: '3×10⁶ m/s', C: '3×10¹⁰ m/s', D: '3×10⁴ m/s' }), correct: JSON.stringify(['A']), subject: 'Physics', chapter: 'Optics', difficulty: 'easy' },
            { text: 'Which law states that energy cannot be created or destroyed?', type: 'mcq', options: JSON.stringify({ A: 'Newton\'s First Law', B: 'Law of Conservation of Energy', C: 'Ohm\'s Law', D: 'Hooke\'s Law' }), correct: JSON.stringify(['B']), subject: 'Physics', chapter: 'Thermodynamics', difficulty: 'medium' },
            { text: 'What is the unit of electric current?', type: 'mcq', options: JSON.stringify({ A: 'Volt', B: 'Ampere', C: 'Ohm', D: 'Watt' }), correct: JSON.stringify(['B']), subject: 'Physics', chapter: 'Electricity', difficulty: 'easy' },

            // Chemistry
            { text: 'Which of the following is a noble gas?', type: 'mcq', options: JSON.stringify({ A: 'Oxygen', B: 'Nitrogen', C: 'Helium', D: 'Carbon' }), correct: JSON.stringify(['C']), subject: 'Chemistry', chapter: 'Periodic Table', difficulty: 'easy' },
            { text: 'Which of the following is NOT a type of chemical bond?', type: 'mcq', options: JSON.stringify({ A: 'Ionic', B: 'Covalent', C: 'Hydrogen', D: 'Nuclear' }), correct: JSON.stringify(['D']), subject: 'Chemistry', chapter: 'Chemical Bonding', difficulty: 'medium' },
            { text: 'What is the chemical formula of water?', type: 'mcq', options: JSON.stringify({ A: 'H2O', B: 'CO2', C: 'NaCl', D: 'HCl' }), correct: JSON.stringify(['A']), subject: 'Chemistry', chapter: 'Basic Chemistry', difficulty: 'easy' },
            { text: 'Which element is the most abundant in the Earth\'s atmosphere?', type: 'mcq', options: JSON.stringify({ A: 'Oxygen', B: 'Nitrogen', C: 'Carbon Dioxide', D: 'Argon' }), correct: JSON.stringify(['B']), subject: 'Chemistry', chapter: 'Environmental Chemistry', difficulty: 'easy' },
            { text: 'What is the pH value of pure water?', type: 'mcq', options: JSON.stringify({ A: '5', B: '6', C: '7', D: '8' }), correct: JSON.stringify(['C']), subject: 'Chemistry', chapter: 'Acids and Bases', difficulty: 'easy' },

            // Mathematics
            { text: 'What is the derivative of x²?', type: 'mcq', options: JSON.stringify({ A: '2x', B: 'x²', C: '2x²', D: 'x' }), correct: JSON.stringify(['A']), subject: 'Mathematics', chapter: 'Calculus', difficulty: 'medium' },
            { text: 'What is the approximate value of π (pi)?', type: 'nat', options: JSON.stringify({}), correct: JSON.stringify(['3.14']), subject: 'Mathematics', chapter: 'Geometry', difficulty: 'easy' },
            { text: 'What is the area of a circle with radius r?', type: 'mcq', options: JSON.stringify({ A: 'πr', B: '2πr', C: 'πr²', D: '2πr²' }), correct: JSON.stringify(['C']), subject: 'Mathematics', chapter: 'Geometry', difficulty: 'easy' },
            { text: 'What is 7 × 8?', type: 'nat', options: JSON.stringify({}), correct: JSON.stringify(['56']), subject: 'Mathematics', chapter: 'Arithmetic', difficulty: 'easy' },
            { text: 'What is the square root of 144?', type: 'nat', options: JSON.stringify({}), correct: JSON.stringify(['12']), subject: 'Mathematics', chapter: 'Algebra', difficulty: 'easy' },

            // Biology
            { text: 'Which organelle is known as the powerhouse of the cell?', type: 'mcq', options: JSON.stringify({ A: 'Nucleus', B: 'Ribosome', C: 'Mitochondria', D: 'Golgi' }), correct: JSON.stringify(['C']), subject: 'Biology', chapter: 'Cell Biology', difficulty: 'easy' },
            { text: 'Which blood type is the universal donor?', type: 'mcq', options: JSON.stringify({ A: 'A+', B: 'AB+', C: 'O-', D: 'B-' }), correct: JSON.stringify(['C']), subject: 'Biology', chapter: 'Human Physiology', difficulty: 'medium' },
            { text: 'Which vitamin is produced by sunlight?', type: 'mcq', options: JSON.stringify({ A: 'Vitamin A', B: 'Vitamin B', C: 'Vitamin C', D: 'Vitamin D' }), correct: JSON.stringify(['D']), subject: 'Biology', chapter: 'Biochemistry', difficulty: 'easy' },
            { text: 'What is the largest organ in the human body?', type: 'mcq', options: JSON.stringify({ A: 'Liver', B: 'Skin', C: 'Brain', D: 'Heart' }), correct: JSON.stringify(['B']), subject: 'Biology', chapter: 'Human Anatomy', difficulty: 'easy' },
            { text: 'What is the process by which plants make food?', type: 'mcq', options: JSON.stringify({ A: 'Respiration', B: 'Photosynthesis', C: 'Transpiration', D: 'Fermentation' }), correct: JSON.stringify(['B']), subject: 'Biology', chapter: 'Plant Biology', difficulty: 'easy' }
        ];

        const questionIds = [];
        for (const q of questions) {
            const result = await pool.query(
                `INSERT INTO questions (
                    question_text, question_type, options, correct_answers,
                    subject, chapter, difficulty,
                    marks, negative_marks,
                    is_pyq, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id`,
                [q.text, q.type, q.options, q.correct,
                 q.subject, q.chapter, q.difficulty,
                 4, 1,
                 Math.random() > 0.7]
            );
            questionIds.push(result.rows[0].id);
        }
        console.log(`✅ ${questionIds.length} questions created`);

        // ============================================
        // 4. CREATE TESTS
        // ============================================
        console.log('📝 Creating tests...');

        const testData = [
            { title: 'AITS 2026 - Physics Mock Test', type: 'aits', marks: 40, duration: 180 },
            { title: 'Part Syllabus - Chemistry', type: 'part', marks: 30, duration: 120 },
            { title: 'Full Syllabus - PCM', type: 'full', marks: 60, duration: 180 }
        ];

        const testIds = [];
        for (const t of testData) {
            const result = await pool.query(
                `INSERT INTO tests (
                    title, type, mode, duration_minutes, total_marks,
                    marking_scheme, subjects, syllabus, instructions,
                    is_published, published_at,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, 'online', $3, $4,
                    '{"correct": 4, "incorrect": -1, "unattempted": 0}',
                    '{Physics,Chemistry,Mathematics}',
                    'Complete syllabus for JEE Advanced',
                    'Follow the instructions carefully. All questions are compulsory.',
                    true,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                ) RETURNING id`,
                [t.title, t.type, t.duration, t.marks]
            );
            testIds.push(result.rows[0].id);
        }
        console.log(`✅ ${testIds.length} tests created`);

        // Add questions to tests
        for (let t = 0; t < testIds.length; t++) {
            const startIdx = t * 5;
            const endIdx = Math.min(startIdx + 5, questionIds.length);
            for (let i = startIdx; i < endIdx; i++) {
                await pool.query(
                    `INSERT INTO test_questions (test_id, question_id, question_order)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (test_id, question_id) DO NOTHING`,
                    [testIds[t], questionIds[i], i - startIdx]
                );
            }
            console.log(`✅ Added questions to test: ${testData[t].title}`);
        }

        // ============================================
        // 5. CREATE ATTEMPTS & ANALYTICS
        // ============================================
        console.log('📝 Creating attempts and analytics...');

        for (let s = 0; s < studentIds.length; s++) {
            const studentId = studentIds[s];
            const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

            for (let t = 0; t < testIds.length; t++) {
                const testId = testIds[t];
                const score = Math.floor(Math.random() * 30) + 10;
                const correct = Math.floor(score / 4);
                const incorrect = Math.floor(Math.random() * 3) + 1;
                const unattempted = 10 - correct - incorrect;

                // Create attempt
                const attemptResult = await pool.query(
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
                    ) RETURNING id`,
                    [studentId, testId, score, correct, incorrect, unattempted]
                );

                const attemptId = attemptResult.rows[0].id;

                // Subject-wise scores
                const subjectScores = {};
                const subjectAccuracy = {};
                subjects.forEach(sub => {
                    subjectScores[sub] = Math.floor(Math.random() * 30) + 60;
                    subjectAccuracy[sub] = Math.floor(Math.random() * 30) + 60;
                });

                const speed = Math.random() * 100;
                const accuracy = Math.random() * 100;
                let quadrant = '';
                if (speed >= 50 && accuracy >= 70) quadrant = 'FAST_ACCURATE';
                else if (speed >= 50 && accuracy < 70) quadrant = 'FAST_INACCURATE';
                else if (speed < 50 && accuracy >= 70) quadrant = 'SLOW_ACCURATE';
                else quadrant = 'SLOW_INACCURATE';

                // Create analytics
                await pool.query(
                    `INSERT INTO analytics (
                        student_id, attempt_id, test_id,
                        total_score, total_marks,
                        subject_wise_scores, subject_wise_accuracy,
                        overall_accuracy,
                        speed_accuracy_quadrant,
                        incorrect_question_ids,
                        all_india_rank,
                        all_india_percentile,
                        calculated_at
                    ) VALUES (
                        $1, $2, $3,
                        $4, 100,
                        $5, $6,
                        $7,
                        $8,
                        $9,
                        ${10 - s},
                        ${80 + (s * 1.5)},
                        CURRENT_TIMESTAMP
                    )`,
                    [
                        studentId, attemptId, testId,
                        Math.floor(Object.values(subjectScores).reduce((a, b) => a + b, 0) / 4),
                        subjectScores,
                        subjectAccuracy,
                        Math.floor(Math.random() * 30) + 60,
                        quadrant,
                        JSON.stringify([questionIds[0], questionIds[2], questionIds[5]])
                    ]
                );

                // Add to error book
                const wrongQuestions = [questionIds[0], questionIds[2], questionIds[5]];
                for (const qId of wrongQuestions) {
                    await pool.query(
                        `INSERT INTO error_book (student_id, question_id, attempt_id, added_at)
                         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                         ON CONFLICT (student_id, question_id) DO NOTHING`,
                        [studentId, qId, attemptId]
                    );
                }
            }
        }
        console.log(`✅ Attempts and analytics created for ${studentIds.length} students`);

        // ============================================
        // 6. CREATE DPPS
        // ============================================
        console.log('📝 Creating DPPs...');

        for (let s = 0; s < Math.min(studentIds.length, 5); s++) {
            const studentId = studentIds[s];
            const dppQuestions = questionIds.slice(0, 5);

            await pool.query(
                `INSERT INTO dpps (student_id, for_date, questions, status, streak_count, generated_by)
                 VALUES ($1, CURRENT_DATE, $2, 'pending', ${s + 1}, 'auto')
                 ON CONFLICT (student_id, for_date) DO NOTHING`,
                [studentId, JSON.stringify(dppQuestions)]
            );
        }
        console.log(`✅ DPPs created`);

        // ============================================
        // 7. CREATE DOUBTS
        // ============================================
        console.log('📝 Creating doubts...');

        const doubtData = [
            { student: 0, subject: 'Physics', title: 'Newton\'s Laws doubt', description: 'Can someone explain Newton\'s Third Law with an example?' },
            { student: 1, subject: 'Chemistry', title: 'Thermodynamics problem', description: 'Need help understanding entropy in thermodynamics.' },
            { student: 2, subject: 'Mathematics', title: 'Calculus integration doubt', description: 'How to solve ∫x² dx?' },
            { student: 3, subject: 'Biology', title: 'Cell division question', description: 'What is the difference between mitosis and meiosis?' },
            { student: 4, subject: 'Physics', title: 'Optics numerical', description: 'Need help with lens formula numerical.' }
        ];

        for (let d = 0; d < doubtData.length; d++) {
            const doubt = doubtData[d];
            const studentId = studentIds[doubt.student % studentIds.length];
            const facultyId = facultyIds[d % facultyIds.length] || facultyIds[0];

            const slaAcknowledge = new Date();
            slaAcknowledge.setHours(slaAcknowledge.getHours() + 1);
            const slaResolve = new Date();
            slaResolve.setHours(slaResolve.getHours() + 24);

            const statuses = ['pending', 'assigned', 'resolved'];
            const status = statuses[d % 3];

            const result = await pool.query(
                `INSERT INTO doubts (
                    student_id, subject, title, description,
                    status, assigned_to, assigned_at,
                    sla_acknowledge_deadline, sla_resolve_deadline,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7,
                    $8, $9,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) RETURNING id`,
                [
                    studentId, doubt.subject, doubt.title, doubt.description,
                    status,
                    status === 'assigned' || status === 'resolved' ? facultyId : null,
                    status === 'assigned' || status === 'resolved' ? new Date() : null,
                    slaAcknowledge, slaResolve
                ]
            );

            if (status === 'resolved') {
                await pool.query(
                    `UPDATE doubts SET
                        resolved_by = $1,
                        resolved_at = CURRENT_TIMESTAMP,
                        resolution_rating = $2,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $3`,
                    [facultyId, Math.floor(Math.random() * 2) + 4, result.rows[0].id]
                );
            }
        }
        console.log(`✅ Doubts created`);

        // ============================================
        // 8. CREATE NOTIFICATIONS
        // ============================================
        console.log('📝 Creating notifications...');

        const notificationData = [
            { type: 'test_assigned', title: 'New Test Assigned', message: 'AITS 2026 - Physics has been assigned to your batch.' },
            { type: 'doubt_resolved', title: 'Doubt Resolved', message: 'Your doubt on Newton\'s Laws has been resolved.' },
            { type: 'batch_change', title: 'Batch Update', message: 'You have been promoted to Alpha batch!' },
            { type: 'test_result', title: 'Test Results Available', message: 'Your results for AITS 2026 are now available.' },
            { type: 'dpp_reminder', title: 'DPP Reminder', message: 'Don\'t forget to complete your daily DPP!' }
        ];

        for (let n = 0; n < notificationData.length; n++) {
            const notif = notificationData[n];
            const studentId = studentIds[n % studentIds.length];

            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [studentId, notif.type, notif.title, notif.message, false]
            );
        }
        console.log(`✅ Notifications created`);

        // ============================================
        // 9. SUMMARY
        // ============================================
        console.log('\n🎉 COMPLETE DUMMY DATA SEEDED SUCCESSFULLY!');
        console.log('📊 SUMMARY:');
        console.log(`   👥 Users: ${users.length + facultyData.length + studentNames.length}`);
        console.log(`   🎓 Students: ${studentIds.length}`);
        console.log(`   👨‍🏫 Faculty: ${facultyIds.length}`);
        console.log(`   📚 Batches: ${batchIds.length}`);
        console.log(`   ❓ Questions: ${questionIds.length}`);
        console.log(`   📝 Tests: ${testIds.length}`);
        console.log(`   📊 Attempts: ${studentIds.length * testIds.length}`);
        console.log(`   📕 Error Book entries created`);
        console.log(`   🧩 DPPs created`);
        console.log(`   💬 Doubts created`);
        console.log(`   🔔 Notifications created`);
        console.log('\n🔑 DEMO ACCOUNTS:');
        console.log('   👑 Admin: admin@edutech.com / admin123');
        console.log('   👨‍🏫 Faculty: dr.sharma@edutech.com / password123');
        console.log('   🎓 Student: rahul.kumar@edutech.com / password123');

    } catch (error) {
        console.error('❌ Error seeding dummy data:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

seedCompleteDummyData();