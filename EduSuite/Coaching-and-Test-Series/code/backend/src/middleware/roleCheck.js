// ============================================
// ROLE CHECK MIDDLEWARE - Database Verification
// ============================================

module.exports = function(pool) {
    
    // ============================================
    // CHECK IF USER IS STUDENT (Has student profile)
    // ============================================
    const isStudent = async (req, res, next) => {
        try {
            if (req.userRole === 'admin') {
                return next();
            }

            const result = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [req.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Student access required. Please complete your student profile.'
                });
            }
            
            req.studentId = result.rows[0].id;
            next();
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // CHECK IF USER IS FACULTY (Has faculty profile)
    // ============================================
    const isFaculty = async (req, res, next) => {
        try {
            if (req.userRole === 'admin') {
                return next();
            }

            const result = await pool.query(
                'SELECT id FROM faculty WHERE user_id = $1',
                [req.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Faculty access required. Please complete your faculty profile.'
                });
            }
            
            req.facultyId = result.rows[0].id;
            next();
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // CHECK IF USER IS ADMIN
    // ============================================
    const isAdmin = async (req, res, next) => {
        try {
            if (req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required.'
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // CHECK STUDENT OWNS THE RESOURCE
    // ============================================
    const isStudentOwner = (getStudentId) => {
        return async (req, res, next) => {
            try {
                const resourceStudentId = await getStudentId(req);
                if (req.studentId !== resourceStudentId && req.userRole !== 'admin') {
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

    // ============================================
    // CHECK FACULTY OWNS THE RESOURCE
    // ============================================
    const isFacultyOwner = (getFacultyId) => {
        return async (req, res, next) => {
            try {
                const resourceFacultyId = await getFacultyId(req);
                if (req.facultyId !== resourceFacultyId && req.userRole !== 'admin') {
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
        isStudent,
        isFaculty,
        isAdmin,
        isStudentOwner,
        isFacultyOwner
    };
};