const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        employeeId: user.employeeId,
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  async validateUser(employeeId, password) {
    const user = await User.findOne({ employeeId })
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId');

    if (!user) {
      return { success: false, message: 'Invalid employee ID' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is deactivated' };
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, user };
  }

  async updateLoginHistory(user, req) {
    user.lastLogin = new Date();
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    if (user.loginHistory.length > 100) {
      user.loginHistory = user.loginHistory.slice(-100);
    }

    await user.save();
    return user;
  }

  async generateResetToken(email, employeeId) {
    const user = await User.findOne({ email, employeeId });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    return { success: true, resetToken, user };
  }

  async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: decoded.id,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return { success: false, message: 'Invalid or expired token' };
      }

      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return { success: true, user };
    } catch (error) {
      return { success: false, message: 'Invalid token' };
    }
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { success: true, decoded };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new AuthService();