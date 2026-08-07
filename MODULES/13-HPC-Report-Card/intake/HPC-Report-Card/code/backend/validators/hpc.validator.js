/**
 * ============================================================
 * EduSuite SaaS Platform
 * HPC Report Card Module
 * Validation Layer
 * ------------------------------------------------------------
 * Responsibility:
 * - Validate incoming request payloads
 * - Ensure required fields exist
 * - Validate business rules
 * - Return standardized validation errors
 * ============================================================
 */

const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        value === ""
    );
};

/**
 * ============================================================
 * Validate Competency Creation
 * ============================================================
 */
export const validateCompetency = (data) => {

    const errors = [];

    if (isEmpty(data.org_id))
        errors.push("Organization ID is required.");

    if (isEmpty(data.domain_code))
        errors.push("Domain Code is required.");

    if (isEmpty(data.domain_name))
        errors.push("Domain Name is required.");

    if (isEmpty(data.competency_code))
        errors.push("Competency Code is required.");

    if (isEmpty(data.competency_name))
        errors.push("Competency Name is required.");

    if (isEmpty(data.descriptor_text))
        errors.push("Descriptor Text is required.");

    if (
        data.display_order !== undefined &&
        Number(data.display_order) <= 0
    ) {
        errors.push("Display Order must be greater than zero.");
    }

    return {
        valid: errors.length === 0,
        errors
    };

};

/**
 * ============================================================
 * Validate HPC Entry
 * ============================================================
 */
export const validateEntry = (data) => {

    const errors = [];

    if (isEmpty(data.org_id))
        errors.push("Organization ID is required.");

    if (isEmpty(data.student_id))
        errors.push("Student ID is required.");

    if (isEmpty(data.academic_cycle_id))
        errors.push("Academic Cycle ID is required.");

    if (isEmpty(data.competency_id))
        errors.push("Competency ID is required.");

    if (isEmpty(data.entry_value))
        errors.push("Entry Value is required.");

    if (isEmpty(data.evaluator_id))
        errors.push("Evaluator ID is required.");

    return {
        valid: errors.length === 0,
        errors
    };

};

/**
 * ============================================================
 * Validate Finalization
 * ============================================================
 */
export const validateFinalization = (data) => {

    const errors = [];

    if (isEmpty(data.org_id))
        errors.push("Organization ID is required.");

    if (isEmpty(data.student_id))
        errors.push("Student ID is required.");

    if (isEmpty(data.academic_cycle_id))
        errors.push("Academic Cycle ID is required.");

    if (isEmpty(data.finalized_by))
        errors.push("Finalized By is required.");

    return {
        valid: errors.length === 0,
        errors
    };

};

export default {
    validateCompetency,
    validateEntry,
    validateFinalization
};