// ============================================
// SEED: STATUTORY CONFIGURATIONS
// ============================================

module.exports = async (pool) => {
    console.log('🌱 Seeding statutory configurations...');

    // Get org ID (default org)
    const orgResult = await pool.query(
        'SELECT id FROM orgs WHERE code = $1',
        ['DEFAULT']
    );

    let orgId = 1;
    if (orgResult.rows.length > 0) {
        orgId = orgResult.rows[0].id;
    }

    const configs = [
        // Provident Fund
        { key_name: 'PF_CEILING', value_decimal: 15000 },
        { key_name: 'PF_EE_PCT', value_decimal: 12 },
        { key_name: 'PF_ER_PCT', value_decimal: 3.67 },
        { key_name: 'PF_EPS_PCT', value_decimal: 8.33 },
        { key_name: 'PF_ADMIN_CHARGES', value_decimal: 0.50 },
        { key_name: 'PF_EDLI_CHARGES', value_decimal: 0.50 },
        { key_name: 'PF_RESTRICT_TO_CEILING', value_decimal: 1 },

        // ESI
        { key_name: 'ESI_THRESHOLD', value_decimal: 21000 },
        { key_name: 'ESI_THRESHOLD_DISABLED', value_decimal: 25000 },
        { key_name: 'ESI_EE_PCT', value_decimal: 0.75 },
        { key_name: 'ESI_ER_PCT', value_decimal: 3.25 },

        // Gratuity
        { key_name: 'GRATUITY_CAP', value_decimal: 2000000 },
        { key_name: 'GRATUITY_ELIGIBILITY_YEARS', value_decimal: 5 },

        // Leave Encashment
        { key_name: 'LEAVE_ENCASHMENT_ELIGIBILITY', value_decimal: 1 },
        { key_name: 'LEAVE_ENCASHMENT_CAP_DAYS', value_decimal: 30 },

        // NEP CPD
        { key_name: 'CPD_REQUIRED_HOURS', value_decimal: 50 },
        { key_name: 'CPD_FY_START_MONTH', value_decimal: 4 },
    ];

    let insertedCount = 0;
    for (const config of configs) {
        const result = await pool.query(
            `INSERT INTO statutory_config 
             (org_id, key_name, value_decimal, effective_from, created_at, updated_at)
             VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (org_id, key_name, effective_from) DO NOTHING`,
            [orgId, config.key_name, config.value_decimal]
        );
        if (result.rowCount > 0) insertedCount++;
    }

    console.log(`✅ Seeded ${insertedCount} statutory configurations`);
};