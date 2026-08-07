/**
 * ============================================================
 * EduSuite SaaS Platform
 * API Response Utility
 * ------------------------------------------------------------
 * Responsibility:
 * - Standardize all API responses
 * ============================================================
 */

export const successResponse = (
    res,
    data = null,
    message = "Success",
    statusCode = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

export const errorResponse = (
    res,
    message = "Internal Server Error",
    statusCode = 500,
    errors = null
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    });
};

export default {
    successResponse,
    errorResponse
};