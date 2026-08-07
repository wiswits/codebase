// ============================================
// SEED: ROLES & PERMISSIONS
// ============================================

const { USER_ROLES } = require('../src/utils/constants');

module.exports = async (pool) => {
    console.log('🌱 Seeding roles and permissions...');

    // ============================================
    // ROLES
    // ============================================
    const roles = [
        { code: USER_ROLES.STUDENT, name: 'Student', is_system: true },
        { code: USER_ROLES.FACULTY, name: 'Faculty', is_system: true },
        { code: USER_ROLES.ADMIN, name: 'Administrator', is_system: true }
    ];

    for (const role of roles) {
        await pool.query(
            `INSERT INTO roles (code, name, is_system, created_at, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (code) DO NOTHING`,
            [role.code, role.name, role.is_system]
        );
    }

    // ============================================
    // PERMISSIONS
    // ============================================
    const permissions = [
        // Student permissions
        { role: USER_ROLES.STUDENT, resource: 'student.profile', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'student.profile', action: 'UPDATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'student.documents', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'student.documents', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'test.attempt', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'test.attempt', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'attendance', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'attendance', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'leave.request', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'leave.request', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'leave.request', action: 'UPDATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'leave.balance', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'payslip', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'tax_declaration', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'tax_declaration', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'tax_declaration', action: 'UPDATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'cpd.record', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'cpd.record', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'cpd.record', action: 'UPDATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'doubt.raise', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'doubt.raise', action: 'READ', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'exit', action: 'CREATE', scope: 'SELF' },
        { role: USER_ROLES.STUDENT, resource: 'exit', action: 'READ', scope: 'SELF' },

        // Faculty permissions
        { role: USER_ROLES.FACULTY, resource: 'student.profile', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'student.profile', action: 'UPDATE', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'student.documents', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'attendance', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'attendance', action: 'UPDATE', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'leave.request', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'leave.approve', action: 'APPROVE', scope: 'TEAM' },
        { role: USER_ROLES.FACULTY, resource: 'test.create', action: 'CREATE', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'test.create', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'test.create', action: 'UPDATE', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'test.attempt', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'analytics.rank', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'analytics.attempt', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'errorbook.manage', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'doubt.assign', action: 'APPROVE', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'doubt.resolve', action: 'APPROVE', scope: 'ASSIGNED' },
        { role: USER_ROLES.FACULTY, resource: 'doubt.sla', action: 'READ', scope: 'BATCH' },
        { role: USER_ROLES.FACULTY, resource: 'reports.hr', action: 'READ', scope: 'BATCH' },

        // Admin permissions
        { role: USER_ROLES.ADMIN, resource: 'student.profile', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.profile', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.profile', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.profile', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.documents', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.documents', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.documents', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'student.documents', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'batch.manage', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'batch.manage', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'batch.manage', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'batch.manage', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'batch.promotion', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.create', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.create', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.create', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.create', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.attempt', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'test.publish', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.run', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.run', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.run', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.lock', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.approve', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'payroll.reverse', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'salary_structure', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'salary_structure', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'salary_structure', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'statutory_config', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'statutory_config', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'statutory_config', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'statutory_config', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'reports.hr', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'reports.academic', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'audit.logs', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'faculty.manage', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'faculty.manage', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'faculty.manage', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'faculty.manage', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'exit', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'fnf', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'fnf', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'fnf', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'question.bank', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'question.bank', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'question.bank', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'question.bank', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'cpd.verify', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'appraisal', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'appraisal', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'appraisal', action: 'UPDATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'appraisal', action: 'DELETE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'doubt.verify', action: 'APPROVE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'analytics.rank', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'analytics.attempt', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'errorbook.manage', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'dpp.manage', action: 'CREATE', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'dpp.manage', action: 'READ', scope: 'ORG' },
        { role: USER_ROLES.ADMIN, resource: 'doubt.sla', action: 'READ', scope: 'ORG' },
    ];

    // Get role IDs
    const roleMap = {};
    for (const role of roles) {
        const result = await pool.query(
            'SELECT id FROM roles WHERE code = $1',
            [role.code]
        );
        if (result.rows.length > 0) {
            roleMap[role.code] = result.rows[0].id;
        }
    }

    // Insert permissions
    let insertedCount = 0;
    for (const perm of permissions) {
        const roleId = roleMap[perm.role];
        if (!roleId) continue;

        const result = await pool.query(
            `INSERT INTO role_permissions (role_id, resource, action, scope, created_at, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (role_id, resource, action) DO NOTHING`,
            [roleId, perm.resource, perm.action, perm.scope]
        );
        if (result.rowCount > 0) insertedCount++;
    }

    console.log(`✅ Seeded ${insertedCount} permissions`);
};