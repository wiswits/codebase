-- This migration adds additional hierarchy support and indexes

-- Add created_at to all hierarchy tables if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hms' AND table_name = 'building' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE hms.building ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hms' AND table_name = 'wing' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE hms.wing ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_building_hostel_org ON hms.building(hostel_id, org_id);
CREATE INDEX IF NOT EXISTS idx_wing_building_org ON hms.wing(building_id, org_id);
CREATE INDEX IF NOT EXISTS idx_floor_wing_org ON hms.floor(wing_id, org_id);
CREATE INDEX IF NOT EXISTS idx_room_floor_org ON hms.room(floor_id, org_id);
CREATE INDEX IF NOT EXISTS idx_bed_room_org ON hms.bed(room_id, org_id);

-- Add indexes for sorting
CREATE INDEX IF NOT EXISTS idx_hostel_name ON hms.hostel(name);
CREATE INDEX IF NOT EXISTS idx_building_name ON hms.building(name);
CREATE INDEX IF NOT EXISTS idx_wing_code ON hms.wing(code);
CREATE INDEX IF NOT EXISTS idx_floor_number ON hms.floor(floor_number);
CREATE INDEX IF NOT EXISTS idx_room_number ON hms.room(room_number);
CREATE INDEX IF NOT EXISTS idx_bed_label ON hms.bed(bed_label);