const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

exports.getAllEmployees = async (req, res) => {
  try {
    const { department, role, status } = req.query;
    const query = {};

    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const employees = await User.find(query)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employees'
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employeeDetails = await Employee.findOne({ user: req.params.id });

    res.status(200).json({
      success: true,
      data: { ...employee.toObject(), details: employeeDetails }
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee'
    });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName, lastName, email, role, department, position,
      phone, address, dateOfBirth, joiningDate, manager, skills
    } = req.body;

    const employeeId = await User.generateEmployeeId();

    const user = new User({
      employeeId,
      firstName,
      lastName,
      email,
      password: 'Temp123456',
      role: role || 'employee',
      department,
      position,
      phone,
      address,
      dateOfBirth,
      joiningDate,
      manager,
      skills
    });

    await user.save();

    const employee = new Employee({
      user: user._id
    });

    await employee.save();

    const createdUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: createdUser
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee'
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password;
    delete updates.employeeId;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('department', 'name code')
    .populate('manager', 'firstName lastName employeeId')
    .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (updates.education || updates.experience || updates.emergencyContact || updates.bankDetails) {
      await Employee.findOneAndUpdate(
        { user: id },
        {
          education: updates.education,
          experience: updates.experience,
          emergencyContact: updates.emergencyContact,
          bankDetails: updates.bankDetails
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee'
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await Employee.findOneAndDelete({ user: id });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    });
  }
};

exports.suspendEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee suspended successfully',
      data: user
    });

  } catch (error) {
    console.error('Suspend employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend employee'
    });
  }
};

exports.resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: user
    });

  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role'
    });
  }
};