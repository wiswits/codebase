import {
    executeQuery,
    executeTransaction
} from "../config/db.js";

/* ============================================================
   COMPETENCY QUERIES
============================================================ */

/**
 * Get all competencies
 */
export const getCompetencies = async (
    orgId
) => {

    const sql = `
        SELECT
            id,
            org_id,
            domain_code,
            domain_name,
            competency_code,
            competency_name,
            descriptor_text,
            display_order,
            is_active,
            created_at,
            updated_at
        FROM client_hpc_competencies
        WHERE
            org_id = ?
            AND is_active = TRUE
        ORDER BY
            domain_name,
            display_order ASC
    `;

    return await executeQuery(sql, [orgId]);

};

/**
 * Get competency by ID
 */
export const getCompetencyById = async (
    orgId,
    competencyId
) => {

    const sql = `
        SELECT
            *
        FROM
            client_hpc_competencies
        WHERE
            id = ?
            AND org_id = ?
        LIMIT 1
    `;

    const result = await executeQuery(sql, [
        competencyId,
        orgId
    ]);

    return result[0] || null;

};

/**
 * Create competency
 */
export const createCompetency = async (
    competency
) => {

    const sql = `
        INSERT INTO
        client_hpc_competencies
        (
            org_id,
            domain_code,
            domain_name,
            competency_code,
            competency_name,
            descriptor_text,
            display_order,
            is_active
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `;

    return await executeQuery(sql, [

        competency.org_id,
        competency.domain_code,
        competency.domain_name,
        competency.competency_code,
        competency.competency_name,
        competency.descriptor_text,
        competency.display_order,
        competency.is_active

    ]);

};

/**
 * Update competency
 */
export const updateCompetency = async (
    competencyId,
    orgId,
    competency
) => {

    const sql = `
        UPDATE
            client_hpc_competencies
        SET
            domain_code = ?,
            domain_name = ?,
            competency_code = ?,
            competency_name = ?,
            descriptor_text = ?,
            display_order = ?,
            is_active = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            id = ?
            AND org_id = ?
    `;

    return await executeQuery(sql, [

        competency.domain_code,
        competency.domain_name,
        competency.competency_code,
        competency.competency_name,
        competency.descriptor_text,
        competency.display_order,
        competency.is_active,
        competencyId,
        orgId

    ]);

};

/**
 * Delete competency
 */
export const deleteCompetency = async (
    competencyId,
    orgId
) => {

    const sql = `
        DELETE FROM
            client_hpc_competencies
        WHERE
            id = ?
            AND org_id = ?
    `;

    return await executeQuery(sql, [

        competencyId,
        orgId

    ]);

};

/**
 * Check duplicate competency code
 */
export const competencyCodeExists = async (
    orgId,
    competencyCode
) => {

    const sql = `
        SELECT
            id
        FROM
            client_hpc_competencies
        WHERE
            org_id = ?
            AND competency_code = ?
        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        orgId,
        competencyCode

    ]);

    return result.length > 0;

};

/**
 * Get competencies grouped by domain
 */
export const getCompetenciesByDomain = async (
    orgId
) => {

    const sql = `
        SELECT
            domain_code,
            domain_name,
            id,
            competency_code,
            competency_name,
            descriptor_text,
            display_order
        FROM
            client_hpc_competencies
        WHERE
            org_id = ?
            AND is_active = TRUE
        ORDER BY
            domain_name,
            display_order
    `;

    return await executeQuery(sql, [orgId]);

};

/**
 * Count competencies
 */
export const getCompetencyCount = async (
    orgId
) => {

    const sql = `
        SELECT
            COUNT(*) AS total
        FROM
            client_hpc_competencies
        WHERE
            org_id = ?
            AND is_active = TRUE
    `;

    const result = await executeQuery(sql, [orgId]);

    return result[0].total;

};

export const getStudentEntries = async (
    orgId,
    studentId,
    academicCycleId
) => {

    const sql = `
        SELECT
            e.id,
            e.org_id,
            e.student_id,
            e.academic_cycle_id,
            e.competency_id,
            e.entry_value,
            e.remarks,
            e.evaluator_id,
            e.status,
            e.created_at,
            e.updated_at,

            c.domain_code,
            c.domain_name,
            c.competency_name,
            c.descriptor_text,
            c.display_order

        FROM client_hpc_entries e

        INNER JOIN client_hpc_competencies c
            ON e.competency_id = c.id

        WHERE
            e.org_id = ?
            AND e.student_id = ?
            AND e.academic_cycle_id = ?

        ORDER BY
            c.domain_name,
            c.display_order
    `;

    return await executeQuery(sql, [
        orgId,
        studentId,
        academicCycleId
    ]);

};

/**
 * Get one entry
 */
export const getEntryByCompetency = async (

    orgId,
    studentId,
    academicCycleId,
    competencyId

) => {

    const sql = `
        SELECT *
        FROM client_hpc_entries
        WHERE
            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
            AND competency_id = ?
        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId,
        competencyId

    ]);

    return result[0] || null;

};

/**
 * Check duplicate entry
 */
export const entryExists = async (

    orgId,
    studentId,
    academicCycleId,
    competencyId

) => {

    const sql = `
        SELECT id
        FROM client_hpc_entries
        WHERE
            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
            AND competency_id = ?
        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId,
        competencyId

    ]);

    return result.length > 0;

};

/**
 * Create Draft Entry
 */
export const createEntry = async (

    entry

) => {

    const sql = `
        INSERT INTO
        client_hpc_entries
        (

            org_id,
            student_id,
            academic_cycle_id,
            competency_id,
            entry_value,
            remarks,
            evaluator_id,
            status

        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `;

    return await executeQuery(sql, [

        entry.org_id,
        entry.student_id,
        entry.academic_cycle_id,
        entry.competency_id,
        entry.entry_value,
        entry.remarks,
        entry.evaluator_id,
        entry.status

    ]);

};

/**
 * Update Existing Draft Entry
 */
export const updateEntry = async (

    entry

) => {

    const sql = `
        UPDATE client_hpc_entries

        SET

            entry_value = ?,
            remarks = ?,
            evaluator_id = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE

            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
            AND competency_id = ?
    `;

    return await executeQuery(sql, [

        entry.entry_value,
        entry.remarks,
        entry.evaluator_id,
        entry.status,

        entry.org_id,
        entry.student_id,
        entry.academic_cycle_id,
        entry.competency_id

    ]);

};

/**
 * Delete Draft Entry
 */
export const deleteEntry = async (

    orgId,
    entryId

) => {

    const sql = `
        DELETE
        FROM client_hpc_entries

        WHERE

            id = ?
            AND org_id = ?
    `;

    return await executeQuery(sql, [

        entryId,
        orgId

    ]);

};

/**
 * Count completed entries
 */
export const getCompletedEntryCount = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        SELECT
            COUNT(*) AS completed

        FROM client_hpc_entries

        WHERE

            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
            AND entry_value IS NOT NULL
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId

    ]);

    return result[0].completed;

};

/**
 * Count total competencies
 */
export const getTotalCompetencies = async (

    orgId

) => {

    const sql = `
        SELECT
            COUNT(*) AS total

        FROM
            client_hpc_competencies

        WHERE

            org_id = ?
            AND is_active = TRUE
    `;

    const result = await executeQuery(sql, [

        orgId

    ]);

    return result[0].total;

};

/**
 * Update workflow status
 */
export const updateWorkflowStatus = async (

    orgId,
    studentId,
    academicCycleId,
    status

) => {

    const sql = `
        UPDATE
            client_hpc_entries

        SET

            status = ?

        WHERE

            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
    `;

    return await executeQuery(sql, [

        status,
        orgId,
        studentId,
        academicCycleId

    ]);

};

export const getDomainSummary = async (
    orgId,
    studentId,
    academicCycleId
) => {

    const sql = `
        SELECT
            c.domain_code,
            c.domain_name,

            COUNT(c.id) AS total_competencies,

            COUNT(e.id) AS completed_entries

        FROM client_hpc_competencies c

        LEFT JOIN client_hpc_entries e

            ON e.competency_id = c.id
            AND e.org_id = c.org_id
            AND e.student_id = ?
            AND e.academic_cycle_id = ?

        WHERE

            c.org_id = ?
            AND c.is_active = TRUE

        GROUP BY

            c.domain_code,
            c.domain_name

        ORDER BY

            c.domain_name ASC
    `;

    return await executeQuery(sql, [

        studentId,
        academicCycleId,
        orgId

    ]);

};

/* ============================================================
   HOLISTIC PREVIEW
============================================================ */

/**
 * Build Preview Dataset
 */
export const getHolisticPreview = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        SELECT

            c.domain_name,

            c.competency_name,

            c.descriptor_text,

            e.entry_value,

            e.remarks,

            e.status,

            e.updated_at

        FROM client_hpc_competencies c

        LEFT JOIN client_hpc_entries e

            ON c.id = e.competency_id

            AND e.student_id = ?

            AND e.academic_cycle_id = ?

            AND e.org_id = ?

        WHERE

            c.org_id = ?

            AND c.is_active = TRUE

        ORDER BY

            c.domain_name,

            c.display_order
    `;

    return await executeQuery(sql, [

        studentId,
        academicCycleId,
        orgId,
        orgId

    ]);

};

/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

/**
 * Dashboard Statistics
 */
export const getDashboardStatistics = async (

    orgId

) => {

    const sql = `
        SELECT

            COUNT(DISTINCT student_id) AS total_students,

            SUM(
                CASE
                    WHEN status='DRAFT'
                    THEN 1
                    ELSE 0
                END
            ) AS draft_cards,

            SUM(
                CASE
                    WHEN status='IN_PROGRESS'
                    THEN 1
                    ELSE 0
                END
            ) AS in_progress_cards,

            SUM(
                CASE
                    WHEN status='READY_FOR_REVIEW'
                    THEN 1
                    ELSE 0
                END
            ) AS ready_for_review_cards,

            SUM(
                CASE
                    WHEN status='FINALIZED'
                    THEN 1
                    ELSE 0
                END
            ) AS finalized_cards

        FROM client_hpc_entries

        WHERE

            org_id = ?
    `;

    const result = await executeQuery(sql, [

        orgId

    ]);

    return result[0];

};

/**
 * Recent Activity
 */
export const getRecentActivity = async (

    orgId,
    limit = 10

) => {

    const sql = `
        SELECT

            student_id,

            competency_id,

            entry_value,

            status,

            updated_at

        FROM client_hpc_entries

        WHERE

            org_id = ?

        ORDER BY

            updated_at DESC

        LIMIT ?
    `;

    return await executeQuery(sql, [

        orgId,
        Number(limit)

    ]);

};

/* ============================================================
   FINALIZED CARD QUERIES
============================================================ */

/**
 * Get Finalized Card
 */
export const getCardById = async (

    orgId,
    cardId

) => {

    const sql = `
        SELECT

            *

        FROM

            client_hpc_cards

        WHERE

            id = ?

            AND org_id = ?

        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        cardId,
        orgId

    ]);

    return result[0] || null;

};

/**
 * Get Finalized Card by Student
 */
export const getFinalizedCard = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        SELECT *

        FROM client_hpc_cards

        WHERE

            org_id = ?

            AND student_id = ?

            AND academic_cycle_id = ?

        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId

    ]);

    return result[0] || null;

};

/**
 * Check if Card Already Finalized
 */
export const isCardFinalized = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        SELECT id

        FROM client_hpc_cards

        WHERE

            org_id = ?

            AND student_id = ?

            AND academic_cycle_id = ?

        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId

    ]);

    return result.length > 0;

};

/* ============================================================
   FINALIZATION & SNAPSHOT QUERIES
============================================================ */

/**
 * Create finalized HPC card snapshot
 */
export const createCardSnapshot = async (card) => {

    const sql = `
        INSERT INTO client_hpc_cards
        (
            org_id,
            student_id,
            academic_cycle_id,
            status,
            snapshot_json,
            finalized_by,
            finalized_at,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            'FINALIZED',
            ?,
            ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    `;

    return await executeQuery(sql, [

        card.org_id,
        card.student_id,
        card.academic_cycle_id,
        JSON.stringify(card.snapshot_json),
        card.finalized_by

    ]);

};

/**
 * Finalize all draft entries
 */
export const finalizeEntries = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        UPDATE client_hpc_entries
        SET
            status = 'FINALIZED',
            updated_at = CURRENT_TIMESTAMP
        WHERE
            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
    `;

    return await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId

    ]);

};

/**
 * Finalize report card
 * Uses a single database transaction
 */
export const finalizeReportCard = async (

    snapshot

) => {

    return await executeTransaction(async (connection) => {

        const insertSql = `
            INSERT INTO client_hpc_cards
            (
                org_id,
                student_id,
                academic_cycle_id,
                status,
                snapshot_json,
                finalized_by,
                finalized_at,
                created_at
            )
            VALUES
            (
                ?,
                ?,
                ?,
                'FINALIZED',
                ?,
                ?,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
        `;

        await connection.query(insertSql, [

            snapshot.org_id,
            snapshot.student_id,
            snapshot.academic_cycle_id,
            JSON.stringify(snapshot.snapshot_json),
            snapshot.finalized_by

        ]);

        const updateSql = `
            UPDATE client_hpc_entries
            SET
                status = 'FINALIZED',
                updated_at = CURRENT_TIMESTAMP
            WHERE
                org_id = ?
                AND student_id = ?
                AND academic_cycle_id = ?
        `;

        await connection.query(updateSql, [

            snapshot.org_id,
            snapshot.student_id,
            snapshot.academic_cycle_id

        ]);

        return true;

    });

};

/* ============================================================
   PDF / REPORT PAYLOAD
============================================================ */

/**
 * Get report payload
 */
export const getPdfPayload = async (

    orgId,
    cardId

) => {

    const sql = `
        SELECT

            id,
            student_id,
            academic_cycle_id,
            status,
            snapshot_json,
            finalized_by,
            finalized_at

        FROM client_hpc_cards

        WHERE

            id = ?
            AND org_id = ?
            AND status = 'FINALIZED'

        LIMIT 1
    `;

    const result = await executeQuery(sql, [

        cardId,
        orgId

    ]);

    return result[0] || null;

};

/**
 * Recent finalized cards
 */
export const getRecentFinalizedCards = async (
    orgId,
    limit = 10
) => {

    console.log("REPOSITORY orgId:", orgId);
    console.log("REPOSITORY limit:", limit);

    const sql = `
        SELECT
            id,
            student_id,
            academic_cycle_id,
            finalized_at,
            finalized_by
        FROM client_hpc_cards
        WHERE org_id = ?
        ORDER BY finalized_at DESC
        LIMIT ?
    `;

    const result = await executeQuery(sql, [
        Number(orgId),
        Number(limit)
    ]);

    console.log("RESULT:", result);

    return result;
};

/**
 * Check whether all competencies
 * have been completed
 */
export const isEligibleForFinalization = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const sql = `
        SELECT

            COUNT(*) AS completed

        FROM client_hpc_entries

        WHERE

            org_id = ?
            AND student_id = ?
            AND academic_cycle_id = ?
            AND entry_value IS NOT NULL
    `;

    const result = await executeQuery(sql, [

        orgId,
        studentId,
        academicCycleId

    ]);

    return result[0];

};
/* ============================================================
   EXPORTS
============================================================ */

export default {

    /* --------------------------------------------------------
       Database Transaction
    -------------------------------------------------------- */
    executeTransaction,

    /* --------------------------------------------------------
       Competencies
    -------------------------------------------------------- */
    getCompetencies,
    getCompetencyById,
    createCompetency,
    updateCompetency,
    deleteCompetency,
    competencyCodeExists,
    getCompetenciesByDomain,
    getCompetencyCount,

    /* --------------------------------------------------------
       Student Entries
    -------------------------------------------------------- */
    getStudentEntries,
    getEntryByCompetency,
    entryExists,
    createEntry,
    updateEntry,
    deleteEntry,
    getCompletedEntryCount,
    getTotalCompetencies,
    updateWorkflowStatus,

    /* --------------------------------------------------------
       Domain Summary
    -------------------------------------------------------- */
    getDomainSummary,
    getHolisticPreview,

    /* --------------------------------------------------------
       Dashboard
    -------------------------------------------------------- */
    getDashboardStatistics,
    getRecentActivity,

    /* --------------------------------------------------------
       Finalized Cards
    -------------------------------------------------------- */
    getCardById,
    getFinalizedCard,
    isCardFinalized,
    createCardSnapshot,
    finalizeEntries,
    finalizeReportCard,
    getPdfPayload,
    getRecentFinalizedCards,
    isEligibleForFinalization

};