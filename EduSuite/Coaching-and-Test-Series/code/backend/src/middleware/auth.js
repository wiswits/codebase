// ============================================
// AUTH MIDDLEWARE - JWT Verification & Role Check
// ============================================

const jwt = require('jsonwebtoken');

module.exports = function(pool) {
    
    // ============================================
    // VERIFY JWT TOKEN
    // ============================================
    const verifyToken = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided. Please login first.'
                });
            }

            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.userId = decoded.userId;
                req.userRole = decoded.role;
                req.userEmail = decoded.email;
                next();
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Your session has expired. Please login again.'
                    });
                }
                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token. Please login again.'
                    });
                }
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed. Please login again.'
                });
            }
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // ROLE CHECK - Factory Function
    // ============================================
    const checkRole = (allowedRoles) => {
        return (req, res, next) => {
            if (!req.userRole) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized. Please login.'
                });
            }

            if (!allowedRoles.includes(req.userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
            }

            next();
        };
    };

    // ============================================
    // SPECIFIC ROLE CHECKS
    // ============================================
    const isStudent = checkRole(['student', 'admin']);
    const isFaculty = checkRole(['faculty', 'admin']);
    const isAdmin = checkRole(['admin']);

    // ============================================
    // OPTIONAL: Check if user owns the resource
    // ============================================
    const isOwner = (getUserId) => {
        return async (req, res, next) => {
            try {
                const resourceUserId = await getUserId(req);
                if (req.userId !== resourceUserId && req.userRole !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permission to access this resource'
                    });
                }
                next();
            } catch (error) {
                next(error);
            }
        };
    };

    return {
        verifyToken,
        checkRole,
        isStudent,
        isFaculty,
        isAdmin,
        isOwner
    };
};