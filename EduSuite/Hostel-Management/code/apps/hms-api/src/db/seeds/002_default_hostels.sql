-- Seed default hostel configuration
-- This creates a default hostel structure for testing

DO $$ 
DECLARE
    org_id UUID := '00000000-0000-0000-0000-000000000001';
    campus_id UUID := '00000000-0000-0000-0000-000000000002';
    hostel_id UUID;
    building_id UUID;
    wing_id UUID;
    floor_id UUID;
    room_id UUID;
    floor_num INT;
    room_num INT;
    bed_label TEXT;
BEGIN
    -- Only seed if no hostels exist
    IF EXISTS (SELECT 1 FROM hms.hostel LIMIT 1) THEN
        RAISE NOTICE '⚠️  Hostels already exist, skipping sample data';
        RETURN;
    END IF;

    RAISE NOTICE '  📦 Creating sample hostel structure...';

    -- Create hostel
    INSERT INTO hms.hostel (
        id, org_id, campus_id, code, name, type, rules, facilities, is_active
    ) VALUES (
        gen_random_uuid(), org_id, campus_id, 'BH-01', 'Bhagirathi Hostel', 'boys',
        '{"curfew": "10:00 PM", "visitors": "Allowed only in common area", "quiet_hours": "10:00 PM - 6:00 AM"}'::jsonb,
        ARRAY['WiFi', 'AC', 'Gym', 'Mess', 'Laundry', 'Study Room'],
        true
    ) RETURNING id INTO hostel_id;

    RAISE NOTICE '    ✅ Created hostel: Bhagirathi Hostel (ID: %)', hostel_id;

    -- Create building
    INSERT INTO hms.building (id, org_id, hostel_id, code, name)
    VALUES (gen_random_uuid(), org_id, hostel_id, 'A', 'A Block')
    RETURNING id INTO building_id;

    RAISE NOTICE '    ✅ Created building: A Block';

    -- Create wing
    INSERT INTO hms.wing (id, org_id, building_id, code, direction)
    VALUES (gen_random_uuid(), org_id, building_id, 'MAIN', 'N')
    RETURNING id INTO wing_id;

    RAISE NOTICE '    ✅ Created wing: MAIN';

    -- Create floors (Ground + 2 floors)
    FOR floor_num IN 0..2 LOOP
        INSERT INTO hms.floor (id, org_id, wing_id, floor_number)
        VALUES (gen_random_uuid(), org_id, wing_id, floor_num)
        RETURNING id INTO floor_id;

        RAISE NOTICE '      ✅ Created floor: %', floor_num;

        -- Create rooms on each floor (5 rooms per floor)
        FOR room_num IN 1..5 LOOP
            -- Alternate room types: even numbers = double, odd = single
            DECLARE
                room_type TEXT;
                max_capacity INT;
                rent_tier TEXT;
            BEGIN
                IF room_num % 2 = 0 THEN
                    room_type := 'double';
                    max_capacity := 2;
                ELSE
                    room_type := 'single';
                    max_capacity := 1;
                END IF;

                -- Rent tier based on floor
                CASE floor_num
                    WHEN 0 THEN rent_tier := 'standard';
                    WHEN 1 THEN rent_tier := 'premium';
                    WHEN 2 THEN rent_tier := 'luxury';
                END CASE;

                INSERT INTO hms.room (
                    id, org_id, floor_id, room_number, room_type, max_capacity, furniture
                ) VALUES (
                    gen_random_uuid(), org_id, floor_id,
                    floor_num || LPAD(room_num::TEXT, 2, '0'),
                    room_type, max_capacity,
                    jsonb_build_object(
                        'bed', max_capacity,
                        'study_table', max_capacity,
                        'chair', max_capacity,
                        'wardrobe', 1,
                        'ac', true,
                        'fan', true,
                        'light', true
                    )
                ) RETURNING id INTO room_id;

                -- Create beds
                IF room_type = 'double' THEN
                    bed_label := 'A';
                    INSERT INTO hms.bed (org_id, room_id, bed_label, bed_type, rent_tier, status)
                    VALUES (org_id, room_id, bed_label, 'lower', rent_tier, 'vacant');
                    
                    bed_label := 'B';
                    INSERT INTO hms.bed (org_id, room_id, bed_label, bed_type, rent_tier, status)
                    VALUES (org_id, room_id, bed_label, 'upper', rent_tier, 'vacant');
                ELSE
                    bed_label := 'A';
                    INSERT INTO hms.bed (org_id, room_id, bed_label, bed_type, rent_tier, status)
                    VALUES (org_id, room_id, bed_label, 'lower', rent_tier, 'vacant');
                END IF;
            END;
        END LOOP;
    END LOOP;

    -- Create hostel config
    INSERT INTO hms.hostel_config (
        hostel_id, org_id, parent_approval_required, attendance_cutoff_time,
        alert_parent_on_absent, curfew_time, qr_attendance_enabled
    ) VALUES (
        hostel_id, org_id, true, '22:00', true, '22:00', true
    ) ON CONFLICT (hostel_id) DO NOTHING;

    RAISE NOTICE '    ✅ Created hostel config';

    -- Insert a few sample allocations (optional)
    -- These would normally come from APEX
    RAISE NOTICE '  ✅ Sample hostel structure created successfully';
END $$;