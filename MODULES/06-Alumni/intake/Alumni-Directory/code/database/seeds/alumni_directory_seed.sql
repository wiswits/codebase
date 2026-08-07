-- ============================================================
-- EduSuite Alumni Directory
-- Development Seed Data
-- Module: STL-ALU
--
-- IMPORTANT:
-- Development/testing data only.
-- No real alumni or personal information is used.
-- ============================================================

INSERT INTO client_alumni_profiles
(
    org_id,
    first_name,
    last_name,
    email,
    phone,
    batch,
    graduation_year,
    course,
    status
)
VALUES

-- ------------------------------------------------------------
-- Organization 1
-- ------------------------------------------------------------

(
    1,
    'Aarav',
    'Sharma',
    'aarav.sharma@example.test',
    '0000000001',
    '2024',
    2024,
    'Science',
    'active'
),

(
    1,
    'Ananya',
    'Verma',
    'ananya.verma@example.test',
    '0000000002',
    '2024',
    2024,
    'Commerce',
    'active'
),

(
    1,
    'Rohan',
    'Mehta',
    'rohan.mehta@example.test',
    '0000000003',
    '2023',
    2023,
    'Science',
    'active'
),

(
    1,
    'Ishita',
    'Kapoor',
    'ishita.kapoor@example.test',
    '0000000004',
    '2023',
    2023,
    'Arts',
    'active'
),

(
    1,
    'Kabir',
    'Malhotra',
    'kabir.malhotra@example.test',
    '0000000005',
    '2022',
    2022,
    'Commerce',
    'inactive'
),

(
    1,
    'Meera',
    'Joshi',
    'meera.joshi@example.test',
    '0000000006',
    '2022',
    2022,
    'Science',
    'active'
),

(
    1,
    'Vivaan',
    'Gupta',
    'vivaan.gupta@example.test',
    '0000000007',
    '2021',
    2021,
    'Arts',
    'active'
),

(
    1,
    'Diya',
    'Singh',
    'diya.singh@example.test',
    '0000000008',
    '2024',
    2024,
    'Science',
    'active'
),

-- ------------------------------------------------------------
-- Organization 2
-- Used to test tenant isolation
-- ------------------------------------------------------------

(
    2,
    'Arjun',
    'Rao',
    'arjun.rao@example.test',
    '0000000101',
    '2024',
    2024,
    'Science',
    'active'
),

(
    2,
    'Sara',
    'Nair',
    'sara.nair@example.test',
    '0000000102',
    '2023',
    2023,
    'Commerce',
    'active'
),

(
    2,
    'Aditya',
    'Iyer',
    'aditya.iyer@example.test',
    '0000000103',
    '2022',
    2022,
    'Arts',
    'active'
),

(
    2,
    'Nisha',
    'Patel',
    'nisha.patel@example.test',
    '0000000104',
    '2024',
    2024,
    'Commerce',
    'inactive'
);