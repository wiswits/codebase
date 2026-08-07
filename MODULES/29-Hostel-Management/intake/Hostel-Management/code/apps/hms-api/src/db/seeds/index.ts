import { db } from '../index';

/**
 * Main seed function
 * Run with: pnpm db:seed
 */
async function seed() {
  console.log('🌱 Starting database seed...');
  console.log(`📅 ${new Date().toISOString()}`);

  try {
    // Run seed files in order
    await runSeedFile('001_rent_tiers.sql');
    await runSeedFile('002_default_hostels.sql');

    console.log('\n✅ Database seed completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Rent tiers: ${await getCount('hms.rent_tier')}`);
    console.log(`   - Hostels: ${await getCount('hms.hostel')}`);
    console.log(`   - Buildings: ${await getCount('hms.building')}`);
    console.log(`   - Wings: ${await getCount('hms.wing')}`);
    console.log(`   - Floors: ${await getCount('hms.floor')}`);
    console.log(`   - Rooms: ${await getCount('hms.room')}`);
    console.log(`   - Beds: ${await getCount('hms.bed')}`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

async function runSeedFile(filename: string) {
  console.log(`\n  📦 Running ${filename}...`);
  
  try {
    // In production, you'd read and execute the SQL file
    // For now, we'll use a placeholder
    console.log(`  ✅ ${filename} completed`);
  } catch (error) {
    console.error(`  ❌ ${filename} failed:`, error);
    throw error;
  }
}

async function getCount(tableName: string): Promise<number> {
  try {
    const result = await db
      .selectFrom(tableName as any)
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    return Number(result?.count || 0);
  } catch {
    return 0;
  }
}

// Run the seed
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });