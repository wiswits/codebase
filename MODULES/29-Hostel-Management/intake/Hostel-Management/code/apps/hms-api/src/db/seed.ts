import { db } from '../index';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed rent tiers
    await seedRentTiers();
    
    // Seed default hostel config
    await seedHostelConfig();
    
    // Seed roles and permissions
    await seedRolesAndPermissions();
    
    // Seed sample data (optional - for development)
    if (process.env.NODE_ENV !== 'production') {
      await seedSampleData();
    }

    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

async function seedRentTiers() {
  console.log('  📦 Seeding rent tiers...');

  // Rent tiers are stored in the bed table as text
  // No separate table needed - they're defined in the application
  // We'll just log that they're available
  console.log('  ✅ Rent tiers available: standard, premium, luxury');
}

async function seedHostelConfig() {
  console.log('  📦 Seeding hostel config defaults...');

  // Default config will be applied when hostels are created
  // No need to seed default values as they're set in the table definition
  console.log('  ✅ Hostel config defaults ready');
}

async function seedRolesAndPermissions() {
  console.log('  📦 Seeding roles and permissions...');

  // Define roles
  const roles = [
    { id: randomUUID(), name: 'super_admin', description: 'Super Administrator - Full system access' },
    { id: randomUUID(), name: 'org_admin', description: 'Organization Administrator' },
    { id: randomUUID(), name: 'campus_admin', description: 'Campus Administrator' },
    { id: randomUUID(), name: 'hostel_admin', description: 'Hostel Administrator' },
    { id: randomUUID(), name: 'warden', description: 'Hostel Warden' },
    { id: randomUUID(), name: 'asst_warden', description: 'Assistant Warden' },
    { id: randomUUID(), name: 'security_guard', description: 'Security Guard' },
    { id: randomUUID(), name: 'accountant', description: 'Accountant' },
    { id: randomUUID(), name: 'maintenance', description: 'Maintenance Staff' },
    { id: randomUUID(), name: 'student', description: 'Student' },
    { id: randomUUID(), name: 'parent', description: 'Parent' },
  ];

  // Define permissions
  const permissions = [
    // Hierarchy
    'hms:hostel:create:org',
    'hms:hostel:read:org',
    'hms:hostel:update:org',
    'hms:hostel:delete:org',
    'hms:building:create:org',
    'hms:building:read:org',
    'hms:building:update:org',
    'hms:building:delete:org',
    'hms:wing:create:org',
    'hms:wing:read:org',
    'hms:wing:update:org',
    'hms:wing:delete:org',
    'hms:floor:create:org',
    'hms:floor:read:org',
    'hms:floor:update:org',
    'hms:floor:delete:org',
    'hms:room:create:org',
    'hms:room:read:org',
    'hms:room:update:org',
    'hms:room:delete:org',
    'hms:bed:create:org',
    'hms:bed:read:org',
    'hms:bed:update:org',
    'hms:bed:delete:org',
    
    // Allocation
    'hms:allocation:create:hostel',
    'hms:allocation:read:hostel',
    'hms:allocation:update:hostel',
    'hms:allocation:delete:hostel',
    'hms:allocation:approve:hostel',
    
    // Transfer
    'hms:transfer:create:own',
    'hms:transfer:read:hostel',
    'hms:transfer:approve:hostel',
    
    // Attendance
    'hms:attendance:create:hostel',
    'hms:attendance:read:hostel',
    'hms:attendance:update:hostel',
    'hms:attendance:delete:hostel',
    
    // Leave
    'hms:leave:create:own',
    'hms:leave:read:hostel',
    'hms:leave:approve:hostel',
    'hms:leave:delete:hostel',
    
    // Gate Pass
    'hms:gatepass:create:hostel',
    'hms:gatepass:read:hostel',
    'hms:gatepass:scan:gate',
    
    // Complaints
    'hms:complaint:create:own',
    'hms:complaint:read:hostel',
    'hms:complaint:update:hostel',
    'hms:complaint:approve:hostel',
    'hms:complaint:delete:hostel',
    
    // Reports
    'hms:report:read:org',
    'hms:report:export:org',
    
    // Audit
    'hms:audit:read:org',
  ];

  // Define role-permission mappings
  const rolePermissions: Record<string, string[]> = {
    super_admin: permissions,
    org_admin: [
      'hms:hostel:create:org',
      'hms:hostel:read:org',
      'hms:hostel:update:org',
      'hms:hostel:delete:org',
      'hms:building:create:org',
      'hms:building:read:org',
      'hms:building:update:org',
      'hms:building:delete:org',
      'hms:wing:create:org',
      'hms:wing:read:org',
      'hms:wing:update:org',
      'hms:wing:delete:org',
      'hms:floor:create:org',
      'hms:floor:read:org',
      'hms:floor:update:org',
      'hms:floor:delete:org',
      'hms:room:create:org',
      'hms:room:read:org',
      'hms:room:update:org',
      'hms:room:delete:org',
      'hms:bed:create:org',
      'hms:bed:read:org',
      'hms:bed:update:org',
      'hms:bed:delete:org',
      'hms:allocation:create:hostel',
      'hms:allocation:read:hostel',
      'hms:allocation:update:hostel',
      'hms:allocation:delete:hostel',
      'hms:allocation:approve:hostel',
      'hms:transfer:read:hostel',
      'hms:transfer:approve:hostel',
      'hms:attendance:create:hostel',
      'hms:attendance:read:hostel',
      'hms:attendance:update:hostel',
      'hms:attendance:delete:hostel',
      'hms:leave:read:hostel',
      'hms:leave:approve:hostel',
      'hms:complaint:read:hostel',
      'hms:complaint:update:hostel',
      'hms:complaint:approve:hostel',
      'hms:report:read:org',
      'hms:report:export:org',
      'hms:audit:read:org',
    ],
    campus_admin: [
      'hms:hostel:read:org',
      'hms:building:read:org',
      'hms:wing:read:org',
      'hms:floor:read:org',
      'hms:room:read:org',
      'hms:bed:read:org',
      'hms:allocation:create:hostel',
      'hms:allocation:read:hostel',
      'hms:allocation:update:hostel',
      'hms:transfer:read:hostel',
      'hms:attendance:read:hostel',
      'hms:leave:read:hostel',
      'hms:leave:approve:hostel',
      'hms:complaint:read:hostel',
      'hms:report:read:org',
      'hms:report:export:org',
    ],
    hostel_admin: [
      'hms:hostel:read:org',
      'hms:building:read:org',
      'hms:wing:read:org',
      'hms:floor:read:org',
      'hms:room:read:org',
      'hms:bed:read:org',
      'hms:allocation:create:hostel',
      'hms:allocation:read:hostel',
      'hms:allocation:update:hostel',
      'hms:transfer:read:hostel',
      'hms:attendance:create:hostel',
      'hms:attendance:read:hostel',
      'hms:attendance:update:hostel',
      'hms:leave:read:hostel',
      'hms:leave:approve:hostel',
      'hms:complaint:read:hostel',
      'hms:complaint:update:hostel',
      'hms:report:read:org',
    ],
    warden: [
      'hms:hostel:read:org',
      'hms:allocation:read:hostel',
      'hms:transfer:read:hostel',
      'hms:transfer:approve:hostel',
      'hms:attendance:create:hostel',
      'hms:attendance:read:hostel',
      'hms:attendance:update:hostel',
      'hms:leave:read:hostel',
      'hms:leave:approve:hostel',
      'hms:complaint:read:hostel',
      'hms:complaint:update:hostel',
      'hms:report:read:org',
    ],
    asst_warden: [
      'hms:hostel:read:org',
      'hms:allocation:read:hostel',
      'hms:transfer:read:hostel',
      'hms:attendance:create:hostel',
      'hms:attendance:read:hostel',
      'hms:attendance:update:hostel',
      'hms:leave:read:hostel',
      'hms:complaint:read:hostel',
      'hms:complaint:update:hostel',
      'hms:report:read:org',
    ],
    security_guard: [
      'hms:attendance:create:hostel',
      'hms:attendance:read:hostel',
      'hms:gatepass:scan:gate',
      'hms:leave:read:hostel',
    ],
    accountant: [
      'hms:allocation:read:hostel',
      'hms:report:read:org',
      'hms:report:export:org',
    ],
    maintenance: [
      'hms:hostel:read:org',
      'hms:complaint:read:hostel',
      'hms:complaint:update:hostel',
    ],
    student: [
      'hms:hostel:read:org',
      'hms:allocation:read:hostel',
      'hms:transfer:create:own',
      'hms:attendance:read:hostel',
      'hms:leave:create:own',
      'hms:complaint:create:own',
      'hms:complaint:read:hostel',
    ],
    parent: [
      'hms:leave:approve:hostel',
      'hms:attendance:read:hostel',
      'hms:allocation:read:hostel',
    ],
  };

  // Store roles in database
  for (const role of roles) {
    await db
      .insertInto('hms.role')
      .values({
        id: role.id,
        name: role.name,
        description: role.description,
      })
      .onConflict((oc) => oc.column('name').doUpdateSet({
        description: role.description,
      }))
      .execute();
  }

  // Store permissions in database
  for (const permission of permissions) {
    const [resource, action, scope] = permission.replace('hms:', '').split(':');
    await db
      .insertInto('hms.permission')
      .values({
        id: randomUUID(),
        permission: permission,
        resource: resource,
        action: action,
        scope: scope,
      })
      .onConflict((oc) => oc.column('permission').doNothing())
      .execute();
  }

  // Store role-permission mappings
  const roleMap = new Map(roles.map(r => [r.name, r.id]));
  const permissionMap = new Map();

  // Get permission IDs
  const permResults = await db
    .selectFrom('hms.permission')
    .select(['permission', 'id'])
    .execute();

  permResults.forEach(p => {
    permissionMap.set(p.permission, p.id);
  });

  for (const [roleName, permList] of Object.entries(rolePermissions)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const perm of permList) {
      const permId = permissionMap.get(perm);
      if (!permId) continue;

      await db
        .insertInto('hms.role_permission')
        .values({
          id: randomUUID(),
          role_id: roleId,
          permission: perm,
        })
        .onConflict((oc) => oc.columns(['role_id', 'permission']).doNothing())
        .execute();
    }
  }

  console.log(`  ✅ Seeded ${roles.length} roles and ${permissions.length} permissions`);
}

async function seedSampleData() {
  console.log('  📦 Seeding sample data...');

  const orgId = '00000000-0000-0000-0000-000000000001';
  const campusId = '00000000-0000-0000-0000-000000000002';

  // Create a sample hostel
  const hostel = await db
    .insertInto('hms.hostel')
    .values({
      id: randomUUID(),
      org_id: orgId,
      campus_id: campusId,
      code: 'BH-01',
      name: 'Bhagirathi Hostel',
      type: 'boys',
      rules: { 
        curfew: '10:00 PM',
        visitors: 'Allowed only in common area',
        quiet_hours: '10:00 PM - 6:00 AM',
      },
      facilities: ['WiFi', 'AC', 'Gym', 'Mess', 'Laundry'],
      is_active: true,
    })
    .returning('id')
    .executeTakeFirst();

  if (hostel) {
    // Create a building
    const building = await db
      .insertInto('hms.building')
      .values({
        id: randomUUID(),
        org_id: orgId,
        hostel_id: hostel.id,
        code: 'A',
        name: 'A Block',
      })
      .returning('id')
      .executeTakeFirst();

    if (building) {
      // Create a wing
      const wing = await db
        .insertInto('hms.wing')
        .values({
          id: randomUUID(),
          org_id: orgId,
          building_id: building.id,
          code: 'NORTH',
          direction: 'N',
        })
        .returning('id')
        .executeTakeFirst();

      if (wing) {
        // Create floors
        for (let floorNum = 0; floorNum < 3; floorNum++) {
          const floor = await db
            .insertInto('hms.floor')
            .values({
              id: randomUUID(),
              org_id: orgId,
              wing_id: wing.id,
              floor_number: floorNum,
            })
            .returning('id')
            .executeTakeFirst();

          if (floor) {
            // Create rooms on each floor
            for (let roomNum = 1; roomNum <= 5; roomNum++) {
              const roomType = roomNum % 2 === 0 ? 'double' : 'single';
              const maxCapacity = roomType === 'double' ? 2 : 1;

              const room = await db
                .insertInto('hms.room')
                .values({
                  id: randomUUID(),
                  org_id: orgId,
                  floor_id: floor.id,
                  room_number: `${floorNum + 1}${String(roomNum).padStart(2, '0')}`,
                  room_type: roomType,
                  max_capacity: maxCapacity,
                  furniture: {
                    bed: maxCapacity,
                    study_table: maxCapacity,
                    chair: maxCapacity,
                    wardrobe: 1,
                  },
                })
                .returning('id')
                .executeTakeFirst();

              if (room) {
                // Create beds in each room
                const bedLabels = roomType === 'double' ? ['A', 'B'] : ['A'];
                const rentTier = floorNum === 0 ? 'standard' : floorNum === 1 ? 'premium' : 'luxury';

                for (const label of bedLabels) {
                  await db
                    .insertInto('hms.bed')
                    .values({
                      id: randomUUID(),
                      org_id: orgId,
                      room_id: room.id,
                      bed_label: label,
                      bed_type: label === 'A' ? 'lower' : 'upper',
                      rent_tier: rentTier,
                      status: 'vacant',
                    })
                    .execute();
                }
              }
            }
          }
        }
      }
    }

    // Create hostel config
    await db
      .insertInto('hms.hostel_config')
      .values({
        hostel_id: hostel.id,
        org_id: orgId,
        parent_approval_required: true,
        attendance_cutoff_time: '22:00',
        alert_parent_on_absent: true,
        curfew_time: '22:00',
        qr_attendance_enabled: true,
      })
      .onConflict((oc) => oc.column('hostel_id').doUpdateSet({
        parent_approval_required: true,
        attendance_cutoff_time: '22:00',
        alert_parent_on_absent: true,
        curfew_time: '22:00',
        qr_attendance_enabled: true,
      }))
      .execute();

    console.log(`  ✅ Created sample hostel: Bhagirathi Hostel with rooms and beds`);
  }

  // Create sample student users (in a real system, these would come from APEX)
  // This is just for demonstration
  console.log('  ✅ Sample data seeded');
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