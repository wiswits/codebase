exports.checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      const permissions = {
        admin: ['*'],
        hr: ['view_employees', 'manage_attendance', 'manage_leave', 'view_reports', 'manage_announcements', 'manage_documents'],
        manager: ['view_team', 'manage_team_tasks', 'approve_leave', 'view_team_reports', 'schedule_meetings'],
        employee: ['view_self', 'manage_self_tasks', 'apply_leave', 'view_announcements', 'view_documents']
      };

      const userPermissions = permissions[user.role] || [];

      if (userPermissions.includes('*') || userPermissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });

    } catch (error) {
      next(error);
    }
  };
};

exports.requireOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      const userId = req.user.id;
      const userRole = req.user.role;

      if (userRole === 'admin') {
        return next();
      }

      if (resource.employee && resource.employee.toString() === userId) {
        return next();
      }

      if (resource.assignedTo && resource.assignedTo.some(id => id.toString() === userId)) {
        return next();
      }

      if (resource.organizer && resource.organizer.toString() === userId) {
        return next();
      }

      if (resource.author && resource.author.toString() === userId) {
        return next();
      }

      if (resource.user && resource.user.toString() === userId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });

    } catch (error) {
      next(error);
    }
  };
};