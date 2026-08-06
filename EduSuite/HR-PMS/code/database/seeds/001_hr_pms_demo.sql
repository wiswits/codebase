SET FOREIGN_KEY_CHECKS = 0;


DELETE FROM client_appraisal_reviews;
DELETE FROM client_appraisal_goals;
DELETE FROM client_appraisal_cycles;


INSERT INTO client_appraisal_cycles
(
    id,
    org_id,
    cycle_name,
    cycle_code,
    description,
    start_date,
    end_date,
    review_due_date,
    status,
    created_by
)
VALUES
(
    1,
    1,
    'FY 2026 Annual Review',
    'FY2026',
    'Annual Performance Review Cycle',
    '2026-01-01',
    '2026-12-31',
    '2026-12-20',
    'active',
    1
),
(
    2,
    1,
    'Mid Year Review',
    'MID2026',
    'Mid Year Employee Review',
    '2026-06-01',
    '2026-06-30',
    '2026-06-25',
    'completed',
    1
),
(
    3,
    1,
    'Probation Review',
    'PROB2026',
    'Probation Performance Evaluation',
    '2026-02-01',
    '2026-04-30',
    '2026-04-25',
    'completed',
    1
);



INSERT INTO client_appraisal_goals
(
    id,
    org_id,
    cycle_id,
    employee_id,
    goal_title,
    goal_description,
    category,
    priority,
    weightage,
    target_value,
    achieved_value,
    progress_percentage,
    status,
    remarks,
    created_by
)
VALUES

(
1,
1,
1,
101,
'Improve Student Performance',
'Increase student academic performance by 15%',
'performance',
'high',
40,
'15%',
'12%',
80,
'in_progress',
'Good improvement',
1
),

(
2,
1,
1,
101,
'Complete Teacher Training',
'Complete advanced teaching certification',
'learning',
'medium',
20,
'100%',
'100%',
100,
'completed',
'Successfully completed',
1
),

(
3,
1,
1,
101,
'Increase Classroom Engagement',
'Improve classroom participation',
'behavior',
'medium',
20,
'90%',
'85%',
94,
'in_progress',
'Excellent communication',
1
),

(
4,
1,
1,
101,
'Administrative Efficiency',
'Reduce paperwork turnaround time',
'project',
'low',
20,
'5 Days',
'4 Days',
100,
'completed',
'Target achieved',
1
);


INSERT INTO client_appraisal_reviews
(
id,
org_id,
cycle_id,
goal_id,
employee_id,
reviewer_id,
review_type,
rating,
comments,
strengths,
improvements,
achievements,
review_status,
submitted_at,
approved_at,
created_by
)
VALUES

(
1,
1,
1,
1,
101,
201,
'self',
4.50,
'I successfully achieved most of my targets.',
'Communication, Teaching',
'Time Management',
'Improved student results',
'submitted',
NOW(),
NULL,
101
),

(
2,
1,
1,
1,
101,
201,
'reviewer',
4.20,
'Employee performed consistently.',
'Leadership, Teamwork',
'Documentation',
'Exceeded expectations',
'approved',
NOW(),
NOW(),
201
),

(
3,
1,
1,
2,
101,
201,
'self',
5.00,
'Completed all assigned certifications.',
'Quick learner',
'None',
'Certified successfully',
'submitted',
NOW(),
NULL,
101
),

(
4,
1,
1,
2,
101,
201,
'reviewer',
4.80,
'Outstanding learning attitude.',
'Professional growth',
'Presentation skills',
'Excellent progress',
'approved',
NOW(),
NOW(),
201
);

SET FOREIGN_KEY_CHECKS = 1;

