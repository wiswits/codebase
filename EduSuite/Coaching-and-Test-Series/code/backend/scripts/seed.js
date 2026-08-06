// ============================================
// SEED SCRIPT
// ============================================

require('dotenv').config();
const { pool } = require('../src/config/database');
const seedAll = require('../seeds/index');

async function runSeed() {
    console.log('🌱 Running seed script...\n');

    try {
        await seedAll(pool);
        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

runSeed();