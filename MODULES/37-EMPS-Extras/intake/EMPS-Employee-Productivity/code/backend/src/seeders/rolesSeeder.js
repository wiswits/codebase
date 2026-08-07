const User = require('../models/User');
const Department = require('../models/Department');

const seedRoles = async () => {
  try {
    const departments = await Department.find();
    const deptMap = departments.reduce((map, dept) => {
      map[dept.code] = dept._id;
      return map;
    }, {});

    const roleUsers = [
      {
        employeeId: 'HR001',
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@emps.com',
        password: 'HR@123',
        role: 'hr',
        department: deptMap['HR'],
        position: 'HR Manager'
      },
      {
        employeeId: 'MGR001',
        firstName: 'Manager',
        lastName: 'One',
        email: 'manager1@emps.com',
        password: 'Manager@123',
        role: 'manager',
        department: deptMap['IT'],
        position: 'IT Manager'
      },
      {
        employeeId: 'MGR002',
        firstName: 'Manager',
        lastName: 'Two',
        email: 'manager2@emps.com',
        password: 'Manager@123',
        role: 'manager',
        department: deptMap['FIN'],
        position: 'Finance Manager'
      },
      {
        employeeId: 'EMP001',
        firstName: 'Employee',
        lastName: 'One',
        email: 'employee1@emps.com',
        password: 'Employee@123',
        role: 'employee',
        department: deptMap['IT'],
        position: 'Software Developer'
      },
      {
        employeeId: 'EMP002',
        firstName: 'Employee',
        lastName: 'Two',
        email: 'employee2@emps.com',
        password: 'Employee@123',
        role: 'employee',
        department: deptMap['HR'],
        position: 'HR Executive'
      },
      {
        employeeId: 'EMP003',
        firstName: 'Employee',
        lastName: 'Three',
        email: 'employee3@emps.com',
        password: 'Employee@123',
        role: 'employee',
        department: deptMap['FIN'],
        position: 'Accountant'
      }
    ];

    for (const userData of roleUsers) {
      const exists = await User.findOne({ employeeId: userData.employeeId });
      
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`${userData.role} user ${userData.employeeId} created`);
      } else {
        console.log(`User ${userData.employeeId} already exists`);
      }
    }

    console.log('Role users seeded successfully');
  } catch (error) {
    console.error('Error seeding role users:', error);
  }
};

module.exports = seedRoles;