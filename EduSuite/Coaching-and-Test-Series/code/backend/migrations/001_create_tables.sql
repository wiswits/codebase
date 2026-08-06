-- ============================================
-- EDUTECH - COMPLETE DATABASE SCHEMA
-- PostgreSQL
-- ============================================

-- ============================================
-- 1. USERS TABLE (Authentication)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student', 'faculty', 'admin'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. STUDENTS TABLE
-- ============================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    dob DATE,
    gender VARCHAR(10),
    address TEXT,
    parent_name VARCHAR(200),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    target_exam VARCHAR(50), -- 'JEE', 'NEET', 'NTSE', etc.
    current_batch_id INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'graduated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. FACULTY TABLE
-- ============================================
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    faculty_code VARCHAR(50) UNIQUE NOT NULL,
    subjects TEXT[], -- Array of subjects
    specialization VARCHAR(200),
    hire_date DATE DEFAULT CURRENT_DATE,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. BATCHES TABLE
-- ============================================
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 'Alpha', 'Beta', 'Gamma'
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'alpha', 'beta', 'gamma'
    target_exam VARCHAR(50),
    academic_year VARCHAR(20),
    strength INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    -- Auto-promotion settings
    auto_promote_enabled BOOLEAN DEFAULT false,
    promote_trigger_top INTEGER DEFAULT 10, -- Top % for promotion
    demote_trigger_bottom INTEGER DEFAULT 10, -- Bottom % for demotion
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. BATCH_STUDENTS (Many-to-Many)
-- ============================================
CREATE TABLE batch_students (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    joined_at DATE DEFAULT CURRENT_DATE,
    left_at DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, batch_id, joined_at)
);

-- ============================================
-- 6. TESTS TABLE
-- ============================================
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'part', 'full', 'aits', 'mock', 'custom'
    mode VARCHAR(20) NOT NULL, -- 'online', 'omr', 'both'
    duration_minutes INTEGER NOT NULL,
    total_marks INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    marking_scheme JSONB NOT NULL, -- {"correct": 4, "incorrect": -1, "unattempted": 0}
    subjects TEXT[],
    syllabus TEXT,
    instructions TEXT,
    scheduled_at TIMESTAMP,
    batch_id INTEGER REFERENCES batches(id),
    created_by INTEGER REFERENCES faculty(id),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. QUESTIONS TABLE (Question Bank)
-- ============================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'mcq', 'multi_select', 'nat', 'integer'
    options JSONB, -- For MCQ: {"A": "Option A", "B": "Option B", ...}
    correct_answers JSONB NOT NULL, -- ["A"] or ["A","C"] or ["42"]
    subject VARCHAR(100) NOT NULL,
    chapter VARCHAR(100) NOT NULL,
    topic VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    marks DECIMAL(5,2) DEFAULT 4.00,
    negative_marks DECIMAL(5,2) DEFAULT 1.00,
    -- PYQ Metadata
    year_tag VARCHAR(4),
    exam_tag VARCHAR(50), -- 'JEE', 'NEET', 'NTSE', 'RMO', 'INMO'
    is_pyq BOOLEAN DEFAULT false,
    explanation TEXT,
    image_url VARCHAR(500),
    created_by INTEGER REFERENCES faculty(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. TEST_QUESTIONS (Many-to-Many)
-- ============================================
CREATE TABLE test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER DEFAULT 0,
    marks DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, question_id)
);

-- ============================================
-- 9. ATTEMPTS TABLE
-- ============================================
CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'evaluated'
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    submitted_at TIMESTAMP,
    time_taken_seconds INTEGER,
    -- OMR fields
    omr_file_path VARCHAR(500),
    omr_processed BOOLEAN DEFAULT false,
    -- Answers (stored as JSON)
    raw_answers JSONB,
    evaluated_answers JSONB,
    -- Results
    score_obtained DECIMAL(8,2),
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    total_unattempted INTEGER DEFAULT 0,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, test_id)
);

-- ============================================
-- 10. ANALYTICS TABLE (Rank, Percentile, etc.)
-- ============================================
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    attempt_id INTEGER REFERENCES attempts(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id),
    -- Ranks
    all_india_rank INTEGER,
    all_india_percentile DECIMAL(6,2),
    batch_rank INTEGER,
    batch_percentile DECIMAL(6,2),
    -- Scores
    total_score DECIMAL(8,2),
    total_marks DECIMAL(8,2),
    -- Subject-wise
    subject_wise_scores JSONB,
    subject_wise_accuracy JSONB,
    -- Time analysis
    time_per_question JSONB,
    average_time_per_question DECIMAL(6,2),
    -- Accuracy
    overall_accuracy DECIMAL(5,2),
    -- Speed vs Accuracy Quadrant
    speed_accuracy_quadrant VARCHAR(30),
    -- Wrong questions for error book
    incorrect_question_ids JSONB,
    -- Topper comparison
    topper_id INTEGER REFERENCES students(id),
    topper_score DECIMAL(8,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id)
);

-- ============================================
-- 11. ERROR_BOOK TABLE
-- ============================================
CREATE TABLE error_book (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    attempt_id INTEGER REFERENCES attempts(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    in_active_deck BOOLEAN DEFAULT true,
    removed_from_deck_at TIMESTAMP,
    attempted_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_attempted_at TIMESTAMP,
    is_mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, question_id)
);

-- ============================================
-- 12. DPPS TABLE (Daily Practice Problems)
-- ============================================
CREATE TABLE dpps (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    for_date DATE DEFAULT CURRENT_DATE,
    questions JSONB NOT NULL, -- Array of question IDs
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'started', 'submitted', 'evaluated'
    streak_count INTEGER DEFAULT 0,
    last_submitted_at TIMESTAMP,
    submitted_at TIMESTAMP,
    answers JSONB,
    score_obtained DECIMAL(5,2),
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    generated_by VARCHAR(20) DEFAULT 'auto', -- 'auto', 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, for_date)
);

-- ============================================
-- 13. DOUBTS TABLE
-- ============================================
CREATE TABLE doubts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    file_url VARCHAR(500),
    question_id INTEGER REFERENCES questions(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'assigned', 'resolved', 'closed', 'escalated'
    assigned_to INTEGER REFERENCES faculty(id),
    assigned_at TIMESTAMP,
    resolved_by INTEGER REFERENCES faculty(id),
    resolved_at TIMESTAMP,
    -- SLA Tracking
    acknowledged_at TIMESTAMP,
    sla_acknowledge_deadline TIMESTAMP,
    sla_resolve_deadline TIMESTAMP,
    sla_breached BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    parent_doubt_id INTEGER REFERENCES doubts(id),
    resolution_rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. DOUBT_REPLIES TABLE
-- ============================================
CREATE TABLE doubt_replies (
    id SERIAL PRIMARY KEY,
    doubt_id INTEGER REFERENCES doubts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    file_url VARCHAR(500),
    is_faculty_response BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 15. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'test_assigned', 'doubt_resolved', 'batch_change', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 16. BATCH_HISTORY TABLE
-- ============================================
CREATE TABLE batch_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    from_batch_id INTEGER REFERENCES batches(id),
    to_batch_id INTEGER REFERENCES batches(id),
    reason VARCHAR(50) NOT NULL, -- 'auto_promote', 'auto_demote', 'manual', 'admission'
    triggered_by INTEGER REFERENCES users(id),
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_batch ON students(current_batch_id);
CREATE INDEX idx_batch_students_current ON batch_students(student_id, batch_id, is_current);
CREATE INDEX idx_attempts_student ON attempts(student_id);
CREATE INDEX idx_attempts_test ON attempts(test_id);
CREATE INDEX idx_analytics_student ON analytics(student_id);
CREATE INDEX idx_analytics_test ON analytics(test_id);
CREATE INDEX idx_error_book_student ON error_book(student_id);
CREATE INDEX idx_dpps_student_date ON dpps(student_id, for_date);
CREATE INDEX idx_doubts_student ON doubts(student_id);
CREATE INDEX idx_doubts_assigned ON doubts(assigned_to);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- SEED DATA: Initial Batches
-- ============================================
INSERT INTO batches (name, code, type, target_exam, academic_year, is_active) VALUES
('Alpha', 'ALPHA-2026', 'alpha', 'JEE', '2026-27', true),
('Beta', 'BETA-2026', 'beta', 'JEE', '2026-27', true),
('Gamma', 'GAMMA-2026', 'gamma', 'JEE', '2026-27', true),
('Alpha NEET', 'ALPHA-NEET-2026', 'alpha', 'NEET', '2026-27', true);

-- ============================================
-- SEED DATA: Sample Admin User
-- ============================================
-- Password: admin123 (will be hashed by application)
-- INSERT INTO users (email, password_hash, role, first_name, last_name) 
-- VALUES ('admin@edutech.com', 'hashed_password_here', 'admin', 'Admin', 'User');