/**
 * ============================================================
 * EduSuite SaaS Platform
 * Global Error Middleware
 * ------------------------------------------------------------
 * Responsibility:
 * - Catch all unhandled application errors
 * ============================================================
 */

import { errorResponse } from "../utils/apiResponse.js";

const errorMiddleware = (err, req, res, next) => {

    console.error("========================================");
    console.error("Error:");
    console.error(err);
    console.error("========================================");

    if (res.headersSent) {
        return next(err);
    }

    return errorResponse(
        res,
        err.message || "Internal Server Error",
        err.statusCode || 500
    );
};

export default errorMiddleware;