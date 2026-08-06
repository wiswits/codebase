const Department = require('../models/Department');
const User = require('../models/User');

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'firstName lastName employeeId')
      .populate('employees', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments'
    });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'firstName lastName employeeId')
      .populate('employees', 'firstName lastName employeeId');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });

  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department'
    });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;

    const existingDepartment = await Department.findOne({ $or: [{ name }, { code }] });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department name or code already exists'
      });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      manager,
      isActive: true
    });

    await department.save();

    if (manager) {
      await User.findByIdAndUpdate(manager, { department: department._id });
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('manager', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populatedDepartment
    });

  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('manager', 'firstName lastName employeeId')
    .populate('employees', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });

  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
};

exports.getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;

    const employees = await User.find({
      department: id,
      isActive: true
    })
    .select('firstName lastName employeeId email role position phone');

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });

  } catch (error) {
    console.error('Get department employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department employees'
    });
  }
};