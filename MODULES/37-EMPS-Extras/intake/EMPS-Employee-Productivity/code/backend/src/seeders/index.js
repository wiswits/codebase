require('dotenv').config();
const connectDB = require('../config/database');
const seedDepartments = require('./departmentSeeder');
const createAdmin = require('./adminSeeder');
const seedRoles = require('./rolesSeeder');

const runSeeders = async () => {
  try {
    await connectDB();
    console.log('Starting seeders...');
    
    await seedDepartments();
    await createAdmin();
    await seedRoles();
    
    console.log('All seeders completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeders:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;