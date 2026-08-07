/**
 * ============================================================
 * EduSuite SaaS Platform
 * Authentication Middleware
 * ------------------------------------------------------------
 * Responsibility:
 * - Validate authenticated user
 *
 * NOTE:
 * Placeholder implementation.
 * Replace with shared authentication service
 * during platform integration.
 * ============================================================
 */

const authMiddleware = async (req, res, next) => {

    /**
     * Temporary development user
     * Replace with JWT / Session / SSO integration.
     */

    req.user = {
        id: 1,
        org_id: 1,
        role: "ADMIN",
        name: "Development User"
    };

    next();
};

export default authMiddleware;