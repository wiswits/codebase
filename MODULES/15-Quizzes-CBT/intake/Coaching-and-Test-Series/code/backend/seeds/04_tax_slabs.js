// ============================================
// SEED: INCOME TAX SLABS
// ============================================

module.exports = async (pool) => {
    console.log('🌱 Seeding income tax slabs...');

    // Get org ID
    const orgResult = await pool.query(
        'SELECT id FROM orgs WHERE code = $1',
        ['DEFAULT']
    );

    let orgId = 1;
    if (orgResult.rows.length > 0) {
        orgId = orgResult.rows[0].id;
    }

    const slabs = [
        // Old Regime (FY 2026-27)
        { fy: '2026-27', regime: 'OLD', income_from: 0, income_to: 250000, rate_pct: 0 },
        { fy: '2026-27', regime: 'OLD', income_from: 250001, income_to: 500000, rate_pct: 5 },
        { fy: '2026-27', regime: 'OLD', income_from: 500001, income_to: 1000000, rate_pct: 20 },
        { fy: '2026-27', regime: 'OLD', income_from: 1000001, income_to: null, rate_pct: 30 },

        // New Regime (FY 2026-27)
        { fy: '2026-27', regime: 'NEW', income_from: 0, income_to: 300000, rate_pct: 0 },
        { fy: '2026-27', regime: 'NEW', income_from: 300001, income_to: 600000, rate_pct: 5 },
        { fy: '2026-27', regime: 'NEW', income_from: 600001, income_to: 900000, rate_pct: 10 },
        { fy: '2026-27', regime: 'NEW', income_from: 900001, income_to: 1200000, rate_pct: 15 },
        { fy: '2026-27', regime: 'NEW', income_from: 1200001, income_to: 1500000, rate_pct: 20 },
        { fy: '2026-27', regime: 'NEW', income_from: 1500001, income_to: null, rate_pct: 30 },
    ];

    let insertedCount = 0;
    for (const slab of slabs) {
        const result = await pool.query(
            `INSERT INTO tax_slabs 
             (org_id, fy, regime, income_from, income_to, rate_pct, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (org_id, fy, regime, income_from) DO NOTHING`,
            [orgId, slab.fy, slab.regime, slab.income_from, slab.income_to, slab.rate_pct]
        );
        if (result.rowCount > 0) insertedCount++;
    }

    console.log(`✅ Seeded ${insertedCount} tax slabs`);
};