-- ============================================================
-- EduSuite - Student Observations
-- Database Verification Queries
-- Developer: Khushboo
-- ============================================================


-- ============================================================
-- TEST 1: Confirm table exists
-- ============================================================

SHOW TABLES LIKE 'client_student_observations';


-- ============================================================
-- TEST 2: Inspect structure
-- ============================================================

DESCRIBE client_student_observations;


-- ============================================================
-- TEST 3: Inspect indexes
-- ============================================================

SHOW INDEX FROM client_student_observations;


-- ============================================================
-- TEST 4: Verify records
-- ============================================================

SELECT
    id,
    org_id,
    student_id,
    author_id,
    observation_type,
    content,
    created_at,
    updated_at
FROM client_student_observations
ORDER BY id;


-- ============================================================
-- TEST 5: Tenant isolation query - Organization 900001
-- ============================================================

SELECT
    id,
    org_id,
    student_id,
    author_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900001
ORDER BY created_at DESC;


-- Expected:
-- Only records belonging to org_id 900001.


-- ============================================================
-- TEST 6: Tenant isolation query - Organization 900002
-- ============================================================

SELECT
    id,
    org_id,
    student_id,
    author_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900002
ORDER BY created_at DESC;


-- Expected:
-- Only records belonging to org_id 900002.


-- ============================================================
-- TEST 7: Student filtering
-- ============================================================

SELECT
    id,
    student_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900001
  AND student_id = 100001
ORDER BY created_at DESC;


-- ============================================================
-- TEST 8: Author filtering
-- ============================================================

SELECT
    id,
    author_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900001
  AND author_id = 500001
ORDER BY created_at DESC;


-- ============================================================
-- TEST 9: Observation type filtering
-- ============================================================

SELECT
    id,
    student_id,
    author_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900001
  AND observation_type = 'anecdotal'
ORDER BY created_at DESC;


-- ============================================================
-- TEST 10: Class / School filtering
-- ============================================================

SELECT
    id,
    student_id,
    author_id,
    observation_type,
    content
FROM client_student_observations
WHERE org_id = 900001
  AND observation_type = 'class_school'
ORDER BY created_at DESC;


-- ============================================================
-- TEST 11: Count by observation type
-- ============================================================

SELECT
    observation_type,
    COUNT(*) AS total
FROM client_student_observations
WHERE org_id = 900001
GROUP BY observation_type;


-- ============================================================
-- TEST 12: Verify timestamps
-- ============================================================

SELECT
    id,
    created_at,
    updated_at
FROM client_student_observations
ORDER BY id;


-- ============================================================
-- TEST 13: Verify only canonical observation types exist
-- ============================================================

SELECT DISTINCT observation_type
FROM client_student_observations
ORDER BY observation_type;


-- Expected values:
--
-- anecdotal
-- class_school