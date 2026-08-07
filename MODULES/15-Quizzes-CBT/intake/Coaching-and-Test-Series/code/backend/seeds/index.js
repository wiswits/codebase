// ============================================
// SEED INDEX - Run All Seeds
// ============================================

const seedRolesPermissions = require('./01_roles_permissions');
const seedStatutoryConfig = require('./02_statutory_config');
const seedPTSlabs = require('./03_pt_slabs');
const seedTaxSlabs = require('./04_tax_slabs');
const seedCompleteDummyData = require('./06_complete_dummy_data');

module.exports = async (pool) => {
    console.log('🌱 Starting seeding...\n');

    try {
        await seedRolesPermissions(pool);
        await seedStatutoryConfig(pool);
        await seedPTSlabs(pool);
        await seedTaxSlabs(pool);
        await seedCompleteDummyData();

        console.log('\n✅ All seeds completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    }
};