import * as service from "../services/hpc.service.js";

import {
    successResponse
} from "../utils/apiResponse.js";


/* ============================================================
   COMPETENCY CONTROLLERS
============================================================ */

/**
 * Get All Competencies
 */
export const getCompetencies = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const competencies =
            await service.getCompetencies(orgId);

        return successResponse(

            res,
            competencies,
            "Competencies fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Get Competency By ID
 */
export const getCompetency = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const { competencyId } = req.params;

        const competency =
            await service.getCompetency(

                orgId,
                competencyId

            );

        return successResponse(

            res,
            competency,
            "Competency fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Create Competency
 */
export const createCompetency = async (
    req,
    res,
    next
) => {

    try {

        const competency = {

            ...req.body,

            org_id: req.user.org_id

        };

        const result =
            await service.createCompetency(
                competency
            );

        return successResponse(

            res,
            result,
            "Competency created successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Update Competency
 */
export const updateCompetency = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const { competencyId } = req.params;

        const result =
            await service.updateCompetency(

                orgId,
                competencyId,
                req.body

            );

        return successResponse(

            res,
            result,
            "Competency updated successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Delete Competency
 */
export const deleteCompetency = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const { competencyId } = req.params;

        await service.deleteCompetency(

            orgId,
            competencyId

        );

        return successResponse(

            res,
            null,
            "Competency deleted successfully."

        );

    } catch (error) {

        next(error);

    }

};
/* ============================================================
   STUDENT ENTRY CONTROLLERS
============================================================ */

/**
 * Get Student HPC Entries
 */
export const getStudentEntries = async (
    req,
    res,
    next
) => {

    try {

        const { studentId, academicCycleId } = req.params;

        const orgId = req.user.org_id;

        const result =
            await service.getStudentEntries(

                orgId,
                studentId,
                academicCycleId

            );

        return successResponse(

            res,
            result,
            "Student HPC entries fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Save Draft Entry
 */
export const saveDraftEntry = async (
    req,
    res,
    next
) => {

    try {

        const entry = {

            ...req.body,

            org_id: req.user.org_id,

            evaluator_id: req.user.id

        };

        const result =
            await service.saveDraftEntry(entry);

        return successResponse(

            res,
            result,
            "Draft saved successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Delete Draft Entry
 */
export const deleteDraftEntry = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const { entryId } = req.params;

        await service.deleteDraftEntry(

            orgId,
            entryId

        );

        return successResponse(

            res,
            null,
            "Draft deleted successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Update Workflow Status
 */
export const updateWorkflowStatus = async (
    req,
    res,
    next
) => {

    try {

        const orgId = req.user.org_id;

        const {

            studentId,
            academicCycleId

        } = req.params;

        const { status } = req.body;

        const result =
            await service.updateWorkflowStatus(

                orgId,
                studentId,
                academicCycleId,
                status

            );

        return successResponse(

            res,
            result,
            "Workflow status updated successfully."

        );

    } catch (error) {

        next(error);

    }

};
/* ============================================================
   DOMAIN SUMMARY CONTROLLERS
============================================================ */

/**
 * Get Domain Summary
 */
export const getDomainSummary = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const {
            studentId,
            academicCycleId
        } = req.params;

        const result =
            await service.getDomainSummary(

                orgId,
                studentId,
                academicCycleId

            );

        return successResponse(

            res,
            result,
            "Domain summary fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Get Student Progress
 */
export const getProgress = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const {
            studentId,
            academicCycleId
        } = req.params;

        const result =
            await service.getProgress(

                orgId,
                studentId,
                academicCycleId

            );

        return successResponse(

            res,
            result,
            "Progress fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/* ============================================================
   HOLISTIC PREVIEW CONTROLLERS
============================================================ */

/**
 * Get Holistic Preview
 */
export const getHolisticPreview = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const {
            studentId,
            academicCycleId
        } = req.params;

        const result =
            await service.getHolisticPreview(

                orgId,
                studentId,
                academicCycleId

            );

        return successResponse(

            res,
            result,
            "Holistic preview fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/* ============================================================
   DASHBOARD CONTROLLERS
============================================================ */

/**
 * Dashboard Statistics
 */
export const getDashboardStatistics = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const result =
            await service.getDashboardStatistics(
                orgId
            );

        return successResponse(

            res,
            result,
            "Dashboard statistics fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Recent Activity
 */
export const getRecentActivity = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const limit =
            Number(req.query.limit) || 10;

        const result =
            await service.getRecentActivity(

                orgId,
                limit

            );

        return successResponse(

            res,
            result,
            "Recent activity fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Dashboard
 */
export const getDashboard = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const result =
            await service.getDashboard(
                orgId
            );

        return successResponse(

            res,
            result,
            "Dashboard loaded successfully."

        );

    } catch (error) {

        next(error);

    }

};
/* ============================================================
   FINALIZED CARD CONTROLLERS
============================================================ */

/**
 * Get Card By ID
 */
export const getCardById = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const { cardId } = req.params;

        const result =
            await service.getCardById(

                orgId,
                cardId

            );

        return successResponse(

            res,
            result,
            "Card fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Get Finalized Card
 */
export const getFinalizedCard = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const {

            studentId,
            academicCycleId

        } = req.params;

        const result =
            await service.getFinalizedCard(

                orgId,
                studentId,
                academicCycleId

            );

        return successResponse(

            res,
            result,
            "Finalized card fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Get PDF Payload
 */
export const getPdfPayload = async (

    req,
    res,
    next

) => {

    try {

        const orgId = req.user.org_id;

        const { cardId } = req.params;

        const result =
            await service.getPdfPayload(

                orgId,
                cardId

            );

        return successResponse(

            res,
            result,
            "PDF payload fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Finalize Report Card
 */
export const finalizeReportCard = async (

    req,
    res,
    next

) => {

    try {

        const payload = {

            ...req.body,

            org_id: req.user.org_id,

            finalized_by: req.user.id

        };

        const result =
            await service.finalizeReportCard(
                payload
            );

        return successResponse(

            res,
            result,
            "Report card finalized successfully."

        );

    } catch (error) {

        next(error);

    }

};

/**
 * Get Recent Finalized Cards
 */
export const getRecentFinalizedCards = async (

    req,
    res,
    next

) => {

    try {
        console.log("========== RECENT CARDS ==========");
console.log("req.user =", req.user);
console.log("org_id =", req.user?.org_id);

        const orgId = req.user.org_id;

        const limit =
            Number(req.query.limit) || 10;

        const result =
            await service.getRecentFinalizedCards(

                orgId,
                limit

            );

        return successResponse(

            res,
            result,
            "Recent finalized cards fetched successfully."

        );

    } catch (error) {

        next(error);

    }

};

/* ============================================================
   EXPORTS
============================================================ */

export default {

    /* --------------------------------------------------------
       Competencies
    -------------------------------------------------------- */
    getCompetencies,
    getCompetency,
    createCompetency,
    updateCompetency,
    deleteCompetency,

    /* --------------------------------------------------------
       Student Entries
    -------------------------------------------------------- */
    getStudentEntries,
    saveDraftEntry,
    deleteDraftEntry,
    updateWorkflowStatus,

    /* --------------------------------------------------------
       Summary
    -------------------------------------------------------- */
    getDomainSummary,
    getProgress,
    getHolisticPreview,

    /* --------------------------------------------------------
       Dashboard
    -------------------------------------------------------- */
    getDashboardStatistics,
    getRecentActivity,
    getDashboard,

    /* --------------------------------------------------------
       Cards
    -------------------------------------------------------- */
    getCardById,
    getFinalizedCard,
    getPdfPayload,
    getRecentFinalizedCards,

    /* --------------------------------------------------------
       Finalization
    -------------------------------------------------------- */
    finalizeReportCard

};