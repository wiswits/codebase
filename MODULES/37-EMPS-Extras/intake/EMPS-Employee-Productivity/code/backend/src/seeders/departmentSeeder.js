const Department = require('../models/Department');

const departments = [
  { name: 'Administration', code: 'ADMIN', description: 'Company Administration' },
  { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' },
  { name: 'Information Technology', code: 'IT', description: 'IT Department' },
  { name: 'Finance', code: 'FIN', description: 'Finance Department' },
  { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
  { name: 'Sales', code: 'SALES', description: 'Sales Department' },
  { name: 'Operations', code: 'OPS', description: 'Operations Department' },
  { name: 'Research & Development', code: 'RND', description: 'R&D Department' }
];

const seedDepartments = async () => {
  try {
    for (const dept of departments) {
      const exists = await Department.findOne({ code: dept.code });
      
      if (!exists) {
        const department = new Department(dept);
        await department.save();
        console.log(`Department ${dept.name} created`);
      } else {
        console.log(`Department ${dept.name} already exists`);
      }
    }
    
    console.log('Departments seeded successfully');
  } catch (error) {
    console.error('Error seeding departments:', error);
  }
};

module.exports = seedDepartments;