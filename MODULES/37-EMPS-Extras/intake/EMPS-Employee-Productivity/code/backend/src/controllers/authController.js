const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
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
};

exports.login = async (req, res) => {
  try {
    const { employeeId, password, rememberMe } = req.body;

    const user = await User.findOne({ employeeId })
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee ID or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact HR.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee ID or password'
      });
    }

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

    const token = generateToken(user);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        expiresIn: rememberMe ? '7d' : '1d'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { employeeId, email } = req.body;

    const user = await User.findOne({ employeeId, email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with these credentials'
      });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: { resetToken }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

exports.getLoginActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('loginHistory');

    res.status(200).json({
      success: true,
      data: user.loginHistory
    });

  } catch (error) {
    console.error('Get login activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login activity'
    });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed'
    });
  }
};