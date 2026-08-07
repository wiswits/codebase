-- ============================================================
-- WisWits - Student Observations
-- DEVELOPMENT / DEMO SEED
--
-- DO NOT RUN AGAINST PRODUCTION DATA.
-- Contains fictional IDs and fictional observations only.
-- ============================================================


INSERT INTO client_student_observations
(
    org_id,
    student_id,
    author_id,
    observation_type,
    content
)
VALUES
(
    900001,
    100001,
    500001,
    'anecdotal',
    'Demo observation: student participated constructively during a classroom activity.'
);


INSERT INTO client_student_observations
(
    org_id,
    student_id,
    author_id,
    observation_type,
    content
)
VALUES
(
    900001,
    100002,
    500001,
    'class_school',
    'Demo observation: student contributed positively during a school activity.'
);


INSERT INTO client_student_observations
(
    org_id,
    student_id,
    author_id,
    observation_type,
    content
)
VALUES
(
    900001,
    100001,
    500002,
    'class_school',
    'Demo observation: student collaborated effectively during a group activity.'
);


-- ------------------------------------------------------------
-- SECOND TENANT
--
-- Used only to verify tenant separation during development.
-- ------------------------------------------------------------

INSERT INTO client_student_observations
(
    org_id,
    student_id,
    author_id,
    observation_type,
    content
)
VALUES
(
    900002,
    200001,
    600001,
    'anecdotal',
    'Demo observation belonging to a separate development organization.'
);