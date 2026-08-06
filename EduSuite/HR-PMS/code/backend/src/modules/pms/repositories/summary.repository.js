const { pool } = require("../../../config/database");

const getDashboardSummary = async (orgId) => {

    const [[cycles]] = await pool.execute(
        `SELECT COUNT(*) AS total_cycles
         FROM client_appraisal_cycles
         WHERE org_id=?`,
        [orgId]
    );

    const [[goals]] = await pool.execute(
        `SELECT COUNT(*) AS total_goals
         FROM client_appraisal_goals
         WHERE org_id=?`,
        [orgId]
    );

    const [[reviews]] = await pool.execute(
        `SELECT COUNT(*) AS total_reviews
         FROM client_appraisal_reviews
         WHERE org_id=?`,
        [orgId]
    );

    const [[avgRating]] = await pool.execute(
        `SELECT ROUND(AVG(rating),2) AS average_rating
         FROM client_appraisal_reviews
         WHERE org_id=?`,
        [orgId]
    );

    return {
        total_cycles: cycles.total_cycles,
        total_goals: goals.total_goals,
        total_reviews: reviews.total_reviews,
        average_rating: avgRating.average_rating || 0
    };

};

const getCycleSummary = async (cycleId, orgId) => {

    const [[cycle]] = await pool.execute(
        `SELECT
            COUNT(DISTINCT g.id) AS total_goals,
            COUNT(DISTINCT r.id) AS total_reviews,
            ROUND(AVG(r.rating),2) AS average_rating
         FROM client_appraisal_goals g
         LEFT JOIN client_appraisal_reviews r
         ON g.id=r.goal_id
         WHERE g.cycle_id=?
         AND g.org_id=?`,
        [
            cycleId,
            orgId
        ]
    );

    return cycle;

};

const getEmployeeSummary = async (
    employeeId,
    cycleId,
    orgId
) => {

    const [[summary]] = await pool.execute(
        `SELECT
            COUNT(DISTINCT g.id) AS total_goals,
            COUNT(DISTINCT r.id) AS completed_reviews,
            ROUND(AVG(r.rating),2) AS average_rating
         FROM client_appraisal_goals g
         LEFT JOIN client_appraisal_reviews r
         ON g.id=r.goal_id
         WHERE g.employee_id=?
         AND g.cycle_id=?
         AND g.org_id=?`,
        [
            employeeId,
            cycleId,
            orgId
        ]
    );

    return summary;

};

module.exports = {
    getDashboardSummary,
    getCycleSummary,
    getEmployeeSummary
};