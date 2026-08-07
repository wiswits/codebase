const { pool } = require("../../../config/database");

const getAllReviews = async (orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_reviews
         WHERE org_id = ?
         ORDER BY created_at DESC`,
        [orgId]
    );

    return rows;
};

const getReviewById = async (id, orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_reviews
         WHERE id = ?
         AND org_id = ?`,
        [id, orgId]
    );

    return rows[0];
};

const getEmployeeReviews = async (employeeId, cycleId, orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_reviews
         WHERE employee_id = ?
         AND cycle_id = ?
         AND org_id = ?`,
        [
            employeeId,
            cycleId,
            orgId
        ]
    );

    return rows;
};

const createReview = async (reviewData) => {

    const {
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
        created_by
    } = reviewData;

    const [result] = await pool.execute(
        `INSERT INTO client_appraisal_reviews
        (
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
            created_by
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
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
            review_status || "draft",
            created_by
        ]
    );

    return result.insertId;
};

const updateReview = async (id, orgId, reviewData) => {

    const {
        reviewer_id,
        rating,
        comments,
        strengths,
        improvements,
        achievements,
        review_status,
        updated_by
    } = reviewData;

    const [result] = await pool.execute(
        `UPDATE client_appraisal_reviews
         SET
            reviewer_id=?,
            rating=?,
            comments=?,
            strengths=?,
            improvements=?,
            achievements=?,
            review_status=?,
            updated_by=?
         WHERE id=?
         AND org_id=?`,
        [
            reviewer_id,
            rating,
            comments,
            strengths,
            improvements,
            achievements,
            review_status,
            updated_by,
            id,
            orgId
        ]
    );

    return result.affectedRows;
};

const deleteReview = async (id, orgId) => {

    const [result] = await pool.execute(
        `DELETE FROM client_appraisal_reviews
         WHERE id=?
         AND org_id=?`,
        [
            id,
            orgId
        ]
    );

    return result.affectedRows;
};

module.exports = {
    getAllReviews,
    getReviewById,
    getEmployeeReviews,
    createReview,
    updateReview,
    deleteReview
};