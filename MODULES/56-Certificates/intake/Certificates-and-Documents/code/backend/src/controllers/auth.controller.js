const UserModel = require('../models/User.model');
const { generateToken, verifyToken } = require('../utils/jwt');
const { logger } = require('../utils/logger');
const { auditLog } = require('../services/audit.service');

class AuthController {
  static async login(req, res) {
    try {
      const { email, password, orgId } = req.body;

      if (!email || !password || !orgId) {
        return res.status(400).json({
          success: false,
          error: 'Email, password and organization ID are required'
        });
      }

      const user = await UserModel.findByEmail(email, orgId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isValidPassword = await UserModel.validatePassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      await UserModel.updateLastLogin(user.id, orgId);

      const token = generateToken({
        userId: user.id,
        orgId: user.org_id,
        email: user.email,
        role: user.role
      });

      // Audit log
      await auditLog({
        orgId: user.org_id,
        userId: user.id,
        action: 'LOGIN',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          token,
          user: userWithoutPassword
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, orgId } = req.body;

      if (!email || !password || !firstName || !lastName || !role || !orgId) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email, orgId);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists'
        });
      }

      const userId = await UserModel.create({
        orgId,
        email,
        password,
        firstName,
        lastName,
        role
      });

      const user = await UserModel.findById(userId, orgId);

      // Audit log
      await auditLog({
        orgId,
        userId,
        action: 'CREATE',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.userId, req.user.orgId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        success: true,
        data: userWithoutPassword
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, permissions } = req.body;
      const { userId, orgId } = req.user;

      const updated = await UserModel.update(userId, orgId, {
        first_name: firstName,
        last_name: lastName,
        permissions
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          error: 'Update failed'
        });
      }

      const user = await UserModel.findById(userId, orgId);

      // Audit log
      await auditLog({
        orgId,
        userId,
        action: 'UPDATE',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        success: true,
        data: userWithoutPassword
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async logout(req, res) {
    try {
      // Audit log
      await auditLog({
        orgId: req.user.orgId,
        userId: req.user.userId,
        action: 'LOGOUT',
        resourceType: 'user',
        resourceId: req.user.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;