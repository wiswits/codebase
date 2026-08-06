const { pool } = require("../../../config/database");

const getAllCycles = async (orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_cycles
         WHERE org_id = ?
         ORDER BY created_at DESC`,
        [orgId]
    );

    return rows;
};

const getCycleById = async (id, orgId) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM client_appraisal_cycles
         WHERE id = ? AND org_id = ?`,
        [id, orgId]
    );

    return rows[0];
};

const createCycle = async (cycleData) => {
    const {
        org_id,
        cycle_name,
        cycle_code,
        description,
        start_date,
        end_date,
        review_due_date,
        status,
        created_by
    } = cycleData;

    const [result] = await pool.execute(
        `INSERT INTO client_appraisal_cycles
        (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            org_id,
            cycle_name,
            cycle_code,
            description,
            start_date,
            end_date,
            review_due_date,
            status || "draft",
            created_by
        ]
    );

    return result.insertId;
};

const updateCycle = async (id, orgId, cycleData) => {
    const {
        cycle_name,
        cycle_code,
        description,
        start_date,
        end_date,
        review_due_date,
        status,
        updated_by
    } = cycleData;

    const [result] = await pool.execute(
        `UPDATE client_appraisal_cycles
         SET
            cycle_name = ?,
            cycle_code = ?,
            description = ?,
            start_date = ?,
            end_date = ?,
            review_due_date = ?,
            status = ?,
            updated_by = ?
         WHERE id = ?
         AND org_id = ?`,
        [
            cycle_name,
            cycle_code,
            description,
            start_date,
            end_date,
            review_due_date,
            status,
            updated_by,
            id,
            orgId
        ]
    );

    return result.affectedRows;
};

const deleteCycle = async (id, orgId) => {
    const [result] = await pool.execute(
        `DELETE
         FROM client_appraisal_cycles
         WHERE id = ?
         AND org_id = ?`,
        [id, orgId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllCycles,
    getCycleById,
    createCycle,
    updateCycle,
    deleteCycle
};