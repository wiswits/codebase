const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const department = await Department.findOne({ code: 'ADMIN' });
    
    const admin = new User({
      employeeId: 'ADMIN001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@emps.com',
      password: 'Admin@123',
      role: 'admin',
      department: department ? department._id : null,
      position: 'System Administrator',
      isActive: true,
      isVerified: true,
      joiningDate: new Date()
    });

    await admin.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = createAdmin;