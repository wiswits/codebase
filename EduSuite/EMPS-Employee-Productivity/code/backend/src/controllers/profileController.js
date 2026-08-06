const User = require('../models/User');
const Employee = require('../models/Employee');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password -resetPasswordToken -resetPasswordExpires');

    const employeeDetails = await Employee.findOne({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        details: employeeDetails
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    delete updates.password;
    delete updates.employeeId;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName employeeId')
    .select('-password -resetPasswordToken -resetPasswordExpires');

    if (updates.education || updates.experience || updates.emergencyContact || 
        updates.bankDetails || updates.documents) {
      await Employee.findOneAndUpdate(
        { user: userId },
        {
          education: updates.education,
          experience: updates.experience,
          emergencyContact: updates.emergencyContact,
          bankDetails: updates.bankDetails,
          documents: updates.documents
        },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoUrl } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photoUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile photo'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

exports.getEmployeeDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await Employee.findOne({ user: userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee.documents || []
    });

  } catch (error) {
    console.error('Get employee documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee documents'
    });
  }
};

exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, url } = req.body;

    const employee = await Employee.findOne({ user: userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    employee.documents.push({
      name,
      type,
      url,
      uploadedAt: new Date()
    });

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: employee.documents
    });

  } catch (error) {
    console.error('Upload employee document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

exports.deleteEmployeeDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const employee = await Employee.findOne({ user: userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found'
      });
    }

    employee.documents = employee.documents.filter(d => d._id.toString() !== documentId);
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: employee.documents
    });

  } catch (error) {
    console.error('Delete employee document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};