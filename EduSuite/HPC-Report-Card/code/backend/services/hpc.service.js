import repository from "../repositories/hpc.repository.js";

import {
    validateCompetency,
    validateEntry,
    validateFinalization
} from "../validators/hpc.validator.js";

/* ============================================================
   COMPETENCY SERVICES
============================================================ */

/**
 * Get all competencies
 */
export const getCompetencies = async (orgId) => {

    return await repository.getCompetencies(orgId);

};

/**
 * Get competency by ID
 */
export const getCompetency = async (

    orgId,
    competencyId

) => {

    const competency =
        await repository.getCompetencyById(
            orgId,
            competencyId
        );

    if (!competency) {
        throw new Error("Competency not found.");
    }

    return competency;

};

/**
 * Create competency
 */
export const createCompetency = async (

    competency

) => {

    const validation =
        validateCompetency(competency);

    if (!validation.valid) {

        throw new Error(
            validation.errors.join(", ")
        );

    }

    const exists =
        await repository.competencyCodeExists(

            competency.org_id,
            competency.competency_code

        );

    if (exists) {

        throw new Error(
            "Competency Code already exists."
        );

    }

    return await repository.createCompetency(
        competency
    );

};

/**
 * Update competency
 */
export const updateCompetency = async (

    orgId,
    competencyId,
    competency

) => {

    const validation =
        validateCompetency(competency);

    if (!validation.valid) {

        throw new Error(
            validation.errors.join(", ")
        );

    }

    const existing =
        await repository.getCompetencyById(

            orgId,
            competencyId

        );

    if (!existing) {

        throw new Error(
            "Competency not found."
        );

    }

    return await repository.updateCompetency(

        competencyId,
        orgId,
        competency

    );

};

/**
 * Delete competency
 */
export const deleteCompetency = async (

    orgId,
    competencyId

) => {

    const competency =
        await repository.getCompetencyById(

            orgId,
            competencyId

        );

    if (!competency) {

        throw new Error(
            "Competency not found."
        );

    }

    return await repository.deleteCompetency(

        competencyId,
        orgId

    );

};

/* ============================================================
   ENTRY SERVICES
============================================================ */

/**
 * Get student entries
 */
export const getStudentEntries = async (

    orgId,
    studentId,
    academicCycleId

) => {

    return await repository.getStudentEntries(

        orgId,
        studentId,
        academicCycleId

    );

};

/**
 * Save Draft Entry
 */
export const saveDraftEntry = async (

    entry

) => {

    const validation =
        validateEntry(entry);

    if (!validation.valid) {

        throw new Error(
            validation.errors.join(", ")
        );

    }

    const competency =
        await repository.getCompetencyById(

            entry.org_id,
            entry.competency_id

        );

    if (!competency) {

        throw new Error(
            "Invalid competency."
        );

    }

    const exists =
        await repository.entryExists(

            entry.org_id,
            entry.student_id,
            entry.academic_cycle_id,
            entry.competency_id

        );

    if (exists) {

        entry.status = "IN_PROGRESS";

        return await repository.updateEntry(
            entry
        );

    }

    entry.status = "DRAFT";

    return await repository.createEntry(
        entry
    );

};

/**
 * Delete Draft Entry
 */
export const deleteDraftEntry = async (

    orgId,
    entryId

) => {

    return await repository.deleteEntry(

        orgId,
        entryId

    );

};

/**
 * Update Workflow Status
 */
export const updateWorkflowStatus = async (

    orgId,
    studentId,
    academicCycleId,
    status

) => {

    return await repository.updateWorkflowStatus(

        orgId,
        studentId,
        academicCycleId,
        status

    );

};
/* ============================================================
   DOMAIN SUMMARY SERVICES
============================================================ */

/**
 * Get Domain Summary
 */
export const getDomainSummary = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const summary =
        await repository.getDomainSummary(

            orgId,
            studentId,
            academicCycleId

        );

    return summary;

};

/**
 * Calculate Student Progress
 */
export const getProgress = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const completed =
        await repository.getCompletedEntryCount(

            orgId,
            studentId,
            academicCycleId

        );

    const total =
        await repository.getTotalCompetencies(
            orgId
        );

    let percentage = 0;

    if (total > 0) {

        percentage =
            Math.round(
                (completed / total) * 100
            );

    }

    return {

        completed,
        total,
        percentage

    };

};

/* ============================================================
   HOLISTIC CARD PREVIEW
============================================================ */

/**
 * Build Holistic Preview
 */
export const getHolisticPreview = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const preview =
        await repository.getHolisticPreview(

            orgId,
            studentId,
            academicCycleId

        );

    const progress =
        await getProgress(

            orgId,
            studentId,
            academicCycleId

        );

    return {

        progress,

        competencies: preview

    };

};

/* ============================================================
   DASHBOARD SERVICES
============================================================ */

/**
 * Dashboard Statistics
 */
export const getDashboardStatistics = async (

    orgId

) => {

    return await repository
        .getDashboardStatistics(orgId);

};

/**
 * Recent Activity
 */
export const getRecentActivity = async (

    orgId,
    limit = 10

) => {

    return await repository
        .getRecentActivity(
            orgId,
            limit
        );

};

/**
 * Dashboard
 */
export const getDashboard = async (

    orgId

) => {

    const statistics =
        await repository
            .getDashboardStatistics(orgId);

    const activity =
        await repository
            .getRecentActivity(orgId);

    return {

        statistics,
        recentActivity: activity

    };

};

/* ============================================================
   CARD SERVICES
============================================================ */

/**
 * Get Card By ID
 */
export const getCardById = async (

    orgId,
    cardId

) => {

    const card =
        await repository.getCardById(

            orgId,
            cardId

        );

    if (!card) {

        throw new Error(
            "Card not found."
        );

    }

    return card;

};

/**
 * Get Finalized Card
 */
export const getFinalizedCard = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const card =
        await repository
            .getFinalizedCard(

                orgId,
                studentId,
                academicCycleId

            );

    if (!card) {

        throw new Error(
            "Finalized card not found."
        );

    }

    return card;

};

/**
 * Check Finalization Status
 */
export const isCardFinalized = async (

    orgId,
    studentId,
    academicCycleId

) => {

    return await repository
        .isCardFinalized(

            orgId,
            studentId,
            academicCycleId

        );

};

/**
 * Get PDF Payload
 */
export const getPdfPayload = async (

    orgId,
    cardId

) => {

    const payload =
        await repository.getPdfPayload(

            orgId,
            cardId

        );

    if (!payload) {

        throw new Error(
            "PDF payload not found."
        );

    }

    return payload;

};
/* ============================================================
   FINALIZATION SERVICES
============================================================ */

/**
 * Validate whether card can be finalized
 */
export const validateFinalizationEligibility = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const alreadyFinalized =
        await repository.isCardFinalized(
            orgId,
            studentId,
            academicCycleId
        );

    if (alreadyFinalized) {
        throw new Error(
            "This HPC card has already been finalized."
        );
    }

    const progress =
        await getProgress(
            orgId,
            studentId,
            academicCycleId
        );

    if (progress.completed === 0) {
        throw new Error(
            "No competency entries found."
        );
    }

    if (progress.completed < progress.total) {
        throw new Error(
            "All competencies must be completed before finalization."
        );
    }

    return true;

};

/**
 * Build immutable snapshot
 */
export const buildSnapshot = async (

    orgId,
    studentId,
    academicCycleId

) => {

    const summary =
        await getDomainSummary(
            orgId,
            studentId,
            academicCycleId
        );

    const preview =
        await repository.getHolisticPreview(
            orgId,
            studentId,
            academicCycleId
        );

    const progress =
        await getProgress(
            orgId,
            studentId,
            academicCycleId
        );

    return {

        studentId,
        academicCycleId,

        generatedAt:
            new Date().toISOString(),

        progress,

        summary,

        competencies: preview

    };

};

/**
 * Finalize Report Card
 */
export const finalizeReportCard = async (

    data

) => {

    const validation =
        validateFinalization(data);

    if (!validation.valid) {

        throw new Error(
            validation.errors.join(", ")
        );

    }

    await validateFinalizationEligibility(

        data.org_id,
        data.student_id,
        data.academic_cycle_id

    );

    const snapshot =
        await buildSnapshot(

            data.org_id,
            data.student_id,
            data.academic_cycle_id

        );

    await repository.finalizeReportCard({

        org_id: data.org_id,

        student_id: data.student_id,

        academic_cycle_id:
            data.academic_cycle_id,

        finalized_by:
            data.finalized_by,

        snapshot_json: snapshot

    });

    return {

        success: true,

        message:
            "HPC Report Card finalized successfully.",

        snapshot

    };

};

/**
 * Get Recent Finalized Cards
 */
export const getRecentFinalizedCards = async (
    orgId,
    limit = 10
) => {

    console.log("SERVICE orgId:", orgId);
    console.log("SERVICE limit:", limit);

    return await repository.getRecentFinalizedCards(
        orgId,
        limit
    );
};