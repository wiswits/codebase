import express from "express";

import * as controller from "../controllers/hpc.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import permissionMiddleware from "../middleware/permission.middleware.js";

const router = express.Router();

/* ============================================================
   GLOBAL AUTHENTICATION
============================================================ */

router.use(authMiddleware);

/* ============================================================
   COMPETENCIES
============================================================ */

/**
 * @swagger
 * /competencies:
 *   get:
 *     summary: Get all competencies
 *     description: Returns all active HPC competencies for the authenticated organization.
 *     tags:
 *       - Competencies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Competencies fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/competencies",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getCompetencies
);

/**
 * @swagger
 * /competencies/{competencyId}:
 *   get:
 *     summary: Get competency by ID
 *     description: Returns a single competency using its unique identifier.
 *     tags:
 *       - Competencies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: competencyId
 *         required: true
 *         description: Competency ID
 *         schema:
 *           type: integer
 *           example: 15
 *     responses:
 *       200:
 *         description: Competency fetched successfully.
 *       404:
 *         description: Competency not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/competencies/:competencyId",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getCompetency
);

/**
 * @swagger
 * /competencies:
 *   post:
 *     summary: Create competency
 *     description: Creates a new competency for the organization.
 *     tags:
 *       - Competencies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain_code
 *               - domain_name
 *               - competency_code
 *               - competency_name
 *             properties:
 *               domain_code:
 *                 type: string
 *                 example: D1
 *               domain_name:
 *                 type: string
 *                 example: Communication
 *               competency_code:
 *                 type: string
 *                 example: COM001
 *               competency_name:
 *                 type: string
 *                 example: Active Listening
 *               descriptor_text:
 *                 type: string
 *                 example: Demonstrates active listening skills.
 *               display_order:
 *                 type: integer
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Competency created successfully.
 *       400:
 *         description: Validation failed.
 *       409:
 *         description: Duplicate competency code.
 *       500:
 *         description: Internal Server Error.
 */
router.post(
    "/competencies",
    permissionMiddleware([
        "ADMIN"
    ]),
    controller.createCompetency
);

/**
 * @swagger
 * /competencies/{competencyId}:
 *   put:
 *     summary: Update competency
 *     description: Updates an existing competency.
 *     tags:
 *       - Competencies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: competencyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Competency updated successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: Competency not found.
 */
router.put(
    "/competencies/:competencyId",
    permissionMiddleware([
        "ADMIN"
    ]),
    controller.updateCompetency
);

/**
 * @swagger
 * /competencies/{competencyId}:
 *   delete:
 *     summary: Delete competency
 *     description: Deletes a competency from the organization.
 *     tags:
 *       - Competencies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: competencyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Competency deleted successfully.
 *       404:
 *         description: Competency not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete(
    "/competencies/:competencyId",
    permissionMiddleware([
        "ADMIN"
    ]),
    controller.deleteCompetency
);
/* ============================================================
   STUDENT ENTRIES
============================================================ */

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/entries:
 *   get:
 *     summary: Get Student HPC Entries
 *     description: Retrieves all HPC competency entries for a student within a specific academic cycle.
 *     tags:
 *       - Student Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: integer
 *           example: 101
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         description: Academic Cycle ID
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Student entries fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Student not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/students/:studentId/cycles/:academicCycleId/entries",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getStudentEntries
);

/**
 * @swagger
 * /entries:
 *   post:
 *     summary: Save Draft Entry
 *     description: Creates a new draft entry or updates an existing draft for a competency.
 *     tags:
 *       - Student Entries
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - academic_cycle_id
 *               - competency_id
 *               - entry_value
 *             properties:
 *               student_id:
 *                 type: integer
 *                 example: 101
 *               academic_cycle_id:
 *                 type: integer
 *                 example: 2025
 *               competency_id:
 *                 type: integer
 *                 example: 8
 *               entry_value:
 *                 type: string
 *                 example: Excellent
 *               remarks:
 *                 type: string
 *                 example: Shows excellent communication skills.
 *     responses:
 *       200:
 *         description: Draft saved successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: Competency not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post(
    "/entries",
    permissionMiddleware([
        "ADMIN",
        "TEACHER"
    ]),
    controller.saveDraftEntry
);

/**
 * @swagger
 * /entries/{entryId}:
 *   delete:
 *     summary: Delete Draft Entry
 *     description: Deletes an existing draft entry.
 *     tags:
 *       - Student Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         description: Entry ID
 *         schema:
 *           type: integer
 *           example: 52
 *     responses:
 *       200:
 *         description: Draft deleted successfully.
 *       404:
 *         description: Entry not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete(
    "/entries/:entryId",
    permissionMiddleware([
        "ADMIN",
        "TEACHER"
    ]),
    controller.deleteDraftEntry
);

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/workflow:
 *   patch:
 *     summary: Update Workflow Status
 *     description: Updates the workflow status of all HPC entries for a student in an academic cycle.
 *     tags:
 *       - Student Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - DRAFT
 *                   - IN_PROGRESS
 *                   - READY_FOR_REVIEW
 *                   - FINALIZED
 *                 example: READY_FOR_REVIEW
 *     responses:
 *       200:
 *         description: Workflow updated successfully.
 *       400:
 *         description: Invalid workflow status.
 *       404:
 *         description: Student entries not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch(
    "/students/:studentId/cycles/:academicCycleId/workflow",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.updateWorkflowStatus
);
/* ============================================================
   SUMMARY
============================================================ */

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/domain-summary:
 *   get:
 *     summary: Get Domain Summary
 *     description: Retrieves competency completion statistics grouped by domain for a student.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: integer
 *           example: 101
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         description: Academic Cycle ID
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Domain summary fetched successfully.
 *       404:
 *         description: Student record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/students/:studentId/cycles/:academicCycleId/domain-summary",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getDomainSummary
);

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/progress:
 *   get:
 *     summary: Get Student Progress
 *     description: Returns completion percentage of the student's HPC report card.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progress fetched successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/students/:studentId/cycles/:academicCycleId/progress",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getProgress
);

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/preview:
 *   get:
 *     summary: Holistic Report Card Preview
 *     description: Generates a preview of the student's holistic report card before finalization.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preview generated successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/students/:studentId/cycles/:academicCycleId/preview",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getHolisticPreview
);

/* ============================================================
   DASHBOARD
============================================================ */

/**
 * @swagger
 * /dashboard/statistics:
 *   get:
 *     summary: Dashboard Statistics
 *     description: Returns dashboard KPIs and summary statistics for the authenticated organization.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/dashboard/statistics",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getDashboardStatistics
);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Dashboard Overview
 *     description: Returns the complete HPC dashboard including statistics and recent activity.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard loaded successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/dashboard",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getDashboard
);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Recent Activity
 *     description: Returns the latest HPC activities performed within the organization.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Maximum number of activity records to return.
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 20
 *     responses:
 *       200:
 *         description: Recent activity fetched successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/dashboard/activity",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getRecentActivity
);
/* ============================================================
   FINALIZED REPORT CARDS
============================================================ */
router.get(
    "/cards/recent",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getRecentFinalizedCards
);

/**
 * @swagger
 * /cards/{cardId}:
 *   get:
 *     summary: Get Report Card by ID
 *     description: Retrieves a finalized HPC report card using its unique card ID.
 *     tags:
 *       - Report Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         description: Report Card ID
 *         schema:
 *           type: integer
 *           example: 501
 *     responses:
 *       200:
 *         description: Report card fetched successfully.
 *       404:
 *         description: Report card not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/cards/:cardId",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL",
        "TEACHER"
    ]),
    controller.getCardById
);

/**
 * @swagger
 * /students/{studentId}/cycles/{academicCycleId}/card:
 *   get:
 *     summary: Get Finalized Report Card
 *     description: Retrieves the finalized report card of a student for a given academic cycle.
 *     tags:
 *       - Report Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: academicCycleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Finalized report card retrieved successfully.
 *       404:
 *         description: Report card not found.
 *       500:
 *         description: Internal Server Error.
 */

/**
 * @swagger
 * /cards/{cardId}/pdf:
 *   get:
 *     summary: Get PDF Payload
 *     description: Returns all data required for generating the printable PDF version of the report card.
 *     tags:
 *       - Report Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF payload generated successfully.
 *       404:
 *         description: Report card not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/cards/:cardId/pdf",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getPdfPayload
);

/**
 * @swagger
 * /finalize:
 *   post:
 *     summary: Finalize Report Card
 *     description: Validates all draft entries, creates a snapshot, and permanently finalizes the student's HPC report card.
 *     tags:
 *       - Report Cards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - academic_cycle_id
 *             properties:
 *               student_id:
 *                 type: integer
 *                 example: 101
 *               academic_cycle_id:
 *                 type: integer
 *                 example: 2025
 *     responses:
 *       200:
 *         description: Report card finalized successfully.
 *       400:
 *         description: Validation failed or report card is incomplete.
 *       409:
 *         description: Report card has already been finalized.
 *       500:
 *         description: Internal Server Error.
 */
router.post(
    "/finalize",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.finalizeReportCard
);

/**
 * @swagger
 * /cards/recent:
 *   get:
 *     summary: Recent Finalized Report Cards
 *     description: Returns the most recently finalized HPC report cards for the organization.
 *     tags:
 *       - Report Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of report cards to return.
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 20
 *     responses:
 *       200:
 *         description: Recent finalized report cards fetched successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get(
    "/cards/recent",
    permissionMiddleware([
        "ADMIN",
        "PRINCIPAL"
    ]),
    controller.getRecentFinalizedCards
);

export default router;