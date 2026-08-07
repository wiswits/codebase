SELECT DATABASE() AS current_database;


SHOW TABLES LIKE 'client_appraisal_cycles';
SHOW TABLES LIKE 'client_appraisal_goals';
SHOW TABLES LIKE 'client_appraisal_reviews';


DESCRIBE client_appraisal_cycles;

DESCRIBE client_appraisal_goals;

DESCRIBE client_appraisal_reviews;


SHOW INDEX FROM client_appraisal_cycles;

SHOW INDEX FROM client_appraisal_goals;

SHOW INDEX FROM client_appraisal_reviews;
SELECT
'client_appraisal_cycles' AS table_name,
COUNT(*) AS total_records
FROM client_appraisal_cycles;

SELECT
'client_appraisal_goals' AS table_name,
COUNT(*) AS total_records
FROM client_appraisal_goals;

SELECT
'client_appraisal_reviews' AS table_name,
COUNT(*) AS total_records
FROM client_appraisal_reviews;

SELECT
id,
org_id,
cycle_name,
cycle_code,
status,
start_date,
end_date
FROM client_appraisal_cycles
ORDER BY id;


SELECT
id,
cycle_id,
employee_id,
goal_title,
priority,
weightage,
progress_percentage,
status
FROM client_appraisal_goals
ORDER BY id;


SELECT
id,
goal_id,
employee_id,
reviewer_id,
review_type,
rating,
review_status
FROM client_appraisal_reviews
ORDER BY id;


SELECT *
FROM client_appraisal_reviews
WHERE review_type='self';


SELECT *
FROM client_appraisal_reviews
WHERE review_type='reviewer';


SELECT *
FROM client_appraisal_cycles
WHERE status='active';


SELECT *
FROM client_appraisal_goals
WHERE status='completed';


SELECT
goal_title,
progress_percentage
FROM client_appraisal_goals
ORDER BY progress_percentage DESC;


SELECT
review_type,
AVG(rating) AS average_rating,
MIN(rating) AS minimum_rating,
MAX(rating) AS maximum_rating
FROM client_appraisal_reviews
GROUP BY review_type;


SELECT
employee_id,
SUM(weightage) AS total_weightage
FROM client_appraisal_goals
GROUP BY employee_id;

SELECT DISTINCT org_id
FROM client_appraisal_cycles;

SELECT DISTINCT org_id
FROM client_appraisal_goals;

SELECT DISTINCT org_id
FROM client_appraisal_reviews;


SELECT
g.id AS goal_id,
g.goal_title,
c.cycle_name
FROM client_appraisal_goals g
INNER JOIN client_appraisal_cycles c
ON g.cycle_id = c.id;

SELECT
r.id AS review_id,
g.goal_title,
c.cycle_name,
r.review_type,
r.rating
FROM client_appraisal_reviews r
INNER JOIN client_appraisal_goals g
ON r.goal_id = g.id
INNER JOIN client_appraisal_cycles c
ON r.cycle_id = c.id;


SELECT
org_id,
cycle_id,
goal_id,
employee_id,
review_type,
COUNT(*) AS duplicate_count
FROM client_appraisal_reviews
GROUP BY
org_id,
cycle_id,
goal_id,
employee_id,
review_type
HAVING COUNT(*) > 1;


SELECT *
FROM client_appraisal_cycles
WHERE cycle_name IS NULL
OR cycle_code IS NULL;

SELECT *
FROM client_appraisal_goals
WHERE goal_title IS NULL;

SELECT *
FROM client_appraisal_reviews
WHERE review_type IS NULL
OR rating IS NULL;


SELECT
(SELECT COUNT(*) FROM client_appraisal_cycles) AS total_cycles,
(SELECT COUNT(*) FROM client_appraisal_goals) AS total_goals,
(SELECT COUNT(*) FROM client_appraisal_reviews) AS total_reviews;
