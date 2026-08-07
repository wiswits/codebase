/**
 * ============================================================
 * EduSuite SaaS Platform
 * Permission Middleware
 * ------------------------------------------------------------
 * Responsibility:
 * - Verify role-based permissions
 * ============================================================
 */

const permissionMiddleware = (allowedRoles = []) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: "Access Denied"
            });

        }

        next();

    };

};

export default permissionMiddleware;