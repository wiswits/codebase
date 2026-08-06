-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS hms;

-- Set search path
SET search_path TO hms, public;

-- Hierarchy tables

-- Hostel
CREATE TABLE hms.hostel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    campus_id UUID NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boys', 'girls', 'coed', 'staff')),
    rules JSONB DEFAULT '{}',
    facilities TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, code)
);

CREATE INDEX idx_hostel_org_id ON hms.hostel(org_id);
CREATE INDEX idx_hostel_campus_id ON hms.hostel(campus_id);
CREATE INDEX idx_hostel_type ON hms.hostel(type);
CREATE INDEX idx_hostel_is_active ON hms.hostel(is_active);

-- Building
CREATE TABLE hms.building (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    hostel_id UUID NOT NULL REFERENCES hms.hostel(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    caretaker_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hostel_id, code)
);

CREATE INDEX idx_building_org_id ON hms.building(org_id);
CREATE INDEX idx_building_hostel_id ON hms.building(hostel_id);

-- Wing
CREATE TABLE hms.wing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    building_id UUID NOT NULL REFERENCES hms.building(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('E', 'W', 'N', 'S')),
    caretaker_user_id UUID,
    UNIQUE (building_id, code)
);

CREATE INDEX idx_wing_org_id ON hms.wing(org_id);
CREATE INDEX idx_wing_building_id ON hms.wing(building_id);

-- Floor
CREATE TABLE hms.floor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    wing_id UUID NOT NULL REFERENCES hms.wing(id) ON DELETE RESTRICT,
    floor_number INT NOT NULL CHECK (floor_number >= 0),
    UNIQUE (wing_id, floor_number)
);

CREATE INDEX idx_floor_org_id ON hms.floor(org_id);
CREATE INDEX idx_floor_wing_id ON hms.floor(wing_id);
CREATE INDEX idx_floor_floor_number ON hms.floor(floor_number);

-- Room
CREATE TABLE hms.room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    floor_id UUID NOT NULL REFERENCES hms.floor(id) ON DELETE RESTRICT,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'dorm')),
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    furniture JSONB DEFAULT '{}',
    UNIQUE (floor_id, room_number)
);

CREATE INDEX idx_room_org_id ON hms.room(org_id);
CREATE INDEX idx_room_floor_id ON hms.room(floor_id);
CREATE INDEX idx_room_room_type ON hms.room(room_type);

-- Bed
CREATE TABLE hms.bed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    room_id UUID NOT NULL REFERENCES hms.room(id) ON DELETE RESTRICT,
    bed_label TEXT NOT NULL,
    bed_type TEXT,
    rent_tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'blocked', 'reserved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, bed_label)
);

CREATE INDEX idx_bed_org_id ON hms.bed(org_id);
CREATE INDEX idx_bed_room_id ON hms.bed(room_id);
CREATE INDEX idx_bed_status ON hms.bed(status);
CREATE INDEX idx_bed_rent_tier ON hms.bed(rent_tier);

-- Comment on tables
COMMENT ON TABLE hms.hostel IS 'Hostel entity representing a residential building complex';
COMMENT ON TABLE hms.building IS 'Building within a hostel';
COMMENT ON TABLE hms.wing IS 'Wing/section within a building';
COMMENT ON TABLE hms.floor IS 'Floor within a wing';
COMMENT ON TABLE hms.room IS 'Room within a floor';
COMMENT ON TABLE hms.bed IS 'Individual bed within a room';