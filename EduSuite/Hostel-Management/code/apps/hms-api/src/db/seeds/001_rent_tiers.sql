-- Seed rent tiers
-- Rent tiers are stored as text in the bed table
-- This seed ensures they exist in the system

DO $$ 
BEGIN
    -- Create a rent_tiers table for reference (optional)
    CREATE TABLE IF NOT EXISTS hms.rent_tier (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE hms.rent_tier ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY tenant_isolation_rent_tier ON hms.rent_tier
        USING (org_id = current_setting('app.org_id')::uuid OR org_id IS NULL);

    -- Insert default rent tiers (org_id NULL means system-wide)
    INSERT INTO hms.rent_tier (name, display_name, amount_paise, description, is_default)
    VALUES 
        ('standard', 'Standard', 500000, 'Standard room with basic amenities', true),
        ('premium', 'Premium', 750000, 'Premium room with additional amenities', false),
        ('luxury', 'Luxury', 1000000, 'Luxury room with all amenities', false)
    ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        amount_paise = EXCLUDED.amount_paise,
        description = EXCLUDED.description,
        updated_at = now();

    RAISE NOTICE '✅ Rent tiers seeded successfully';
END $$;