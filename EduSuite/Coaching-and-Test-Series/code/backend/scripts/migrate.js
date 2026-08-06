// ============================================
// MIGRATION SCRIPT
// ============================================

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edutech',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function runMigration() {
    try {
        console.log('📦 Running migration...');

        const sql = fs.readFileSync(
            path.join(__dirname, '../migrations/001_create_tables.sql'),
            'utf8'
        );

        await pool.query(sql);
        console.log('✅ Tables created successfully');

        // Seed admin user
        const passwordHash = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
            VALUES ('admin@edutech.com', $1, 'admin', 'Admin', 'User', true)
            ON CONFLICT (email) DO NOTHING
        `, [passwordHash]);
        console.log('✅ Admin user created (admin@edutech.com / admin123)');

        // Seed demo student
        const studentHash = await bcrypt.hash('password123', 10);
        const studentResult = await pool.query(`
            INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
            VALUES ('student@edutech.com', $1, 'student', 'Demo', 'Student', true)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        `, [studentHash]);

        if (studentResult.rows.length > 0) {
            await pool.query(`
                INSERT INTO students (user_id, student_code, enrollment_date, status)
                VALUES ($1, 'STU-DEMO-001', CURRENT_DATE, 'active')
                ON CONFLICT (student_code) DO NOTHING
            `, [studentResult.rows[0].id]);
            console.log('✅ Demo student created (student@edutech.com / password123)');
        }

        // Seed demo faculty
        const facultyHash = await bcrypt.hash('password123', 10);
        const facultyResult = await pool.query(`
            INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
            VALUES ('faculty@edutech.com', $1, 'faculty', 'Demo', 'Faculty', true)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        `, [facultyHash]);

        if (facultyResult.rows.length > 0) {
            await pool.query(`
                INSERT INTO faculty (user_id, faculty_code, subjects, hire_date, is_active)
                VALUES ($1, 'FAC-DEMO-001', ARRAY['Physics', 'Mathematics'], CURRENT_DATE, true)
                ON CONFLICT (faculty_code) DO NOTHING
            `, [facultyResult.rows[0].id]);
            console.log('✅ Demo faculty created (faculty@edutech.com / password123)');
        }

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();