// ============================================
// SEED: PROFESSIONAL TAX SLABS
// ============================================

module.exports = async (pool) => {
    console.log('🌱 Seeding professional tax slabs...');

    // Get org ID
    const orgResult = await pool.query(
        'SELECT id FROM orgs WHERE code = $1',
        ['DEFAULT']
    );

    let orgId = 1;
    if (orgResult.rows.length > 0) {
        orgId = orgResult.rows[0].id;
    }

    // Karnataka PT Slabs
    const slabs = [
        // Karnataka
        { state_code: 'KA', gross_from: 0, gross_to: 15000, tax_amount: 0 },
        { state_code: 'KA', gross_from: 15001, gross_to: 20000, tax_amount: 150 },
        { state_code: 'KA', gross_from: 20001, gross_to: 25000, tax_amount: 200 },
        { state_code: 'KA', gross_from: 25001, gross_to: null, tax_amount: 300 },

        // Maharashtra
        { state_code: 'MH', gross_from: 0, gross_to: 7500, tax_amount: 0 },
        { state_code: 'MH', gross_from: 7501, gross_to: 10000, tax_amount: 175 },
        { state_code: 'MH', gross_from: 10001, gross_to: null, tax_amount: 300 },

        // Tamil Nadu
        { state_code: 'TN', gross_from: 0, gross_to: 21000, tax_amount: 0 },
        { state_code: 'TN', gross_from: 21001, gross_to: null, tax_amount: 250 },

        // West Bengal
        { state_code: 'WB', gross_from: 0, gross_to: 10000, tax_amount: 0 },
        { state_code: 'WB', gross_from: 10001, gross_to: 15000, tax_amount: 110 },
        { state_code: 'WB', gross_from: 15001, gross_to: 25000, tax_amount: 130 },
        { state_code: 'WB', gross_from: 25001, gross_to: 40000, tax_amount: 150 },
        { state_code: 'WB', gross_from: 40001, gross_to: null, tax_amount: 200 },

        // Andhra Pradesh
        { state_code: 'AP', gross_from: 0, gross_to: 15000, tax_amount: 0 },
        { state_code: 'AP', gross_from: 15001, gross_to: 20000, tax_amount: 150 },
        { state_code: 'AP', gross_from: 20001, gross_to: null, tax_amount: 200 },

        // Telangana
        { state_code: 'TS', gross_from: 0, gross_to: 15000, tax_amount: 0 },
        { state_code: 'TS', gross_from: 15001, gross_to: 20000, tax_amount: 150 },
        { state_code: 'TS', gross_from: 20001, gross_to: null, tax_amount: 200 },

        // Gujarat
        { state_code: 'GJ', gross_from: 0, gross_to: 6000, tax_amount: 0 },
        { state_code: 'GJ', gross_from: 6001, gross_to: 9000, tax_amount: 80 },
        { state_code: 'GJ', gross_from: 9001, gross_to: 12000, tax_amount: 150 },
        { state_code: 'GJ', gross_from: 12001, gross_to: null, tax_amount: 200 },

        // Kerala (Annual PT - paid only in certain months)
        { state_code: 'KL', gross_from: 0, gross_to: 2000, tax_amount: 0 },
        { state_code: 'KL', gross_from: 2001, gross_to: 3000, tax_amount: 50 },
        { state_code: 'KL', gross_from: 3001, gross_to: 5000, tax_amount: 100 },
        { state_code: 'KL', gross_from: 5001, gross_to: 7500, tax_amount: 150 },
        { state_code: 'KL', gross_from: 7501, gross_to: 10000, tax_amount: 200 },
        { state_code: 'KL', gross_from: 10001, gross_to: 12500, tax_amount: 300 },
        { state_code: 'KL', gross_from: 12501, gross_to: 16666, tax_amount: 400 },
        { state_code: 'KL', gross_from: 16667, gross_to: null, tax_amount: 500 },
    ];

    let insertedCount = 0;
    for (const slab of slabs) {
        const result = await pool.query(
            `INSERT INTO pt_slabs 
             (org_id, state_code, gross_from, gross_to, tax_amount, effective_from, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (org_id, state_code, gross_from, effective_from) DO NOTHING`,
            [orgId, slab.state_code, slab.gross_from, slab.gross_to, slab.tax_amount]
        );
        if (result.rowCount > 0) insertedCount++;
    }

    console.log(`✅ Seeded ${insertedCount} PT slabs`);
};