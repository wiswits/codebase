const { pool } = require("../../../config/database");

const getAllGoals = async (orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_goals
         WHERE org_id = ?
         ORDER BY created_at DESC`,
        [orgId]
    );

    return rows;
};

const getGoalById = async (id, orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_goals
         WHERE id = ?
         AND org_id = ?`,
        [id, orgId]
    );

    return rows[0];
};

const createGoal = async (goalData) => {
    const {
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
    } = goalData;

    const [result] = await pool.execute(
        `INSERT INTO client_appraisal_goals
        (
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
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            org_id,
            cycle_id,
            employee_id,
            goal_title,
            goal_description,
            category,
            priority,
            weightage,
            target_value,
            achieved_value || 0,
            progress_percentage || 0,
            status || "pending",
            remarks,
            created_by
        ]
    );

    return result.insertId;
};

const updateGoal = async (id, orgId, goalData) => {

    const {
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
        updated_by
    } = goalData;

    const [result] = await pool.execute(
        `UPDATE client_appraisal_goals
         SET
            goal_title=?,
            goal_description=?,
            category=?,
            priority=?,
            weightage=?,
            target_value=?,
            achieved_value=?,
            progress_percentage=?,
            status=?,
            remarks=?,
            updated_by=?
         WHERE id=?
         AND org_id=?`,
        [
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
            updated_by,
            id,
            orgId
        ]
    );

    return result.affectedRows;
};

const deleteGoal = async (id, orgId) => {

    const [result] = await pool.execute(
        `DELETE FROM client_appraisal_goals
         WHERE id=?
         AND org_id=?`,
        [id, orgId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal
};