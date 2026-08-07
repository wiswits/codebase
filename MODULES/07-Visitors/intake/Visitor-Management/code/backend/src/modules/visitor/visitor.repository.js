import { query, withTransaction } from "../../platform-adapters/database.js";

/**
 * Visitor Repository
 *
 * Data-access layer for Visitor Management.
 *
 * IMPORTANT:
 * - No DB pool is created here.
 * - All request values use parameterized SQL.
 * - Every tenant-owned query is scoped by org_id.
 * - Database access happens only through query()/withTransaction().
 */

const VISITOR_TABLE = "client_visitor_logs";
const PASS_TABLE = "client_visitor_passes";

/**
 * Find one visitor belonging to an organization.
 */
export async function findVisitorById(orgId, visitorId) {
  const rows = await query(
    `
      SELECT
        id,
        org_id,
        visitor_name,
        visitor_phone,
        visitor_email,
        visitor_type,
        purpose,
        host_id,
        host_name,
        check_in_at,
        check_out_at,
        status,
        checked_in_by,
        checked_out_by,
        created_at,
        updated_at
      FROM ${VISITOR_TABLE}
      WHERE id = ?
        AND org_id = ?
      LIMIT 1
    `,
    [visitorId, orgId]
  );

  return rows[0] ?? null;
}

/**
 * Return visitors for one organization.
 */
export async function findVisitors(
  orgId,
  {
    search = "",
    status = null,
    visitorType = null,
    limit = 20,
    offset = 0,
  } = {}
) {
  const conditions = ["org_id = ?"];
  const params = [orgId];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (visitorType) {
    conditions.push("visitor_type = ?");
    params.push(visitorType);
  }

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(`
      (
        visitor_name LIKE ?
        OR visitor_phone LIKE ?
        OR visitor_email LIKE ?
        OR purpose LIKE ?
        OR host_name LIKE ?
      )
    `);

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const rows = await query(
    `
      SELECT
        id,
        org_id,
        visitor_name,
        visitor_phone,
        visitor_email,
        visitor_type,
        purpose,
        host_id,
        host_name,
        check_in_at,
        check_out_at,
        status,
        checked_in_by,
        checked_out_by,
        created_at,
        updated_at
      FROM ${VISITOR_TABLE}
      WHERE ${conditions.join(" AND ")}
      ORDER BY check_in_at DESC, id DESC
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `,
    params
  );

  return rows;
}

/**
 * Count visitors using the same filters as findVisitors().
 */
export async function countVisitors(
  orgId,
  { search = "", status = null, visitorType = null } = {}
) {
  const conditions = ["org_id = ?"];
  const params = [orgId];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (visitorType) {
    conditions.push("visitor_type = ?");
    params.push(visitorType);
  }

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(`
      (
        visitor_name LIKE ?
        OR visitor_phone LIKE ?
        OR visitor_email LIKE ?
        OR purpose LIKE ?
        OR host_name LIKE ?
      )
    `);

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  const rows = await query(
    `
      SELECT COUNT(*) AS total
      FROM ${VISITOR_TABLE}
      WHERE ${conditions.join(" AND ")}
    `,
    params
  );

  return Number(rows[0]?.total ?? 0);
}

/**
 * Create a visitor check-in record.
 */
export async function createVisitor(orgId, actorId, data) {
  const result = await query(
    `
      INSERT INTO ${VISITOR_TABLE}
      (
        org_id,
        visitor_name,
        visitor_phone,
        visitor_email,
        visitor_type,
        purpose,
        host_id,
        host_name,
        check_in_at,
        status,
        checked_in_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'checked_in', ?)
    `,
    [
      orgId,
      data.visitorName,
      data.visitorPhone ?? null,
      data.visitorEmail ?? null,
      data.visitorType ?? null,
      data.purpose,
      data.hostId,
      data.hostName ?? null,
      actorId ?? null,
    ]
  );

  return findVisitorById(orgId, result.insertId);
}

/**
 * Check out a visitor.
 *
 * The org_id condition is intentionally included in the UPDATE itself.
 */
export async function checkoutVisitor(orgId, visitorId, actorId) {
  const result = await query(
    `
      UPDATE ${VISITOR_TABLE}
      SET
        status = 'checked_out',
        check_out_at = NOW(),
        checked_out_by = ?
      WHERE id = ?
        AND org_id = ?
        AND status = 'checked_in'
    `,
    [actorId ?? null, visitorId, orgId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findVisitorById(orgId, visitorId);
}

/**
 * Cancel an active visitor record.
 */
export async function cancelVisitor(orgId, visitorId) {
  const result = await query(
    `
      UPDATE ${VISITOR_TABLE}
      SET status = 'cancelled'
      WHERE id = ?
        AND org_id = ?
        AND status = 'checked_in'
    `,
    [visitorId, orgId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findVisitorById(orgId, visitorId);
}

/**
 * Find an existing pass.
 */
export async function findPassByVisitorId(orgId, visitorId) {
  const rows = await query(
    `
      SELECT
        id,
        org_id,
        visitor_log_id,
        pass_code,
        status,
        issued_at,
        expires_at,
        revoked_at,
        created_at,
        updated_at
      FROM ${PASS_TABLE}
      WHERE visitor_log_id = ?
        AND org_id = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [visitorId, orgId]
  );

  return rows[0] ?? null;
}

/**
 * Create a visitor and pass atomically when needed.
 *
 * This demonstrates the same transaction boundary expected from
 * EduSuite's shared withTransaction() helper.
 */
export async function createPass(orgId, visitorId, passCode, expiresAt = null) {
  return withTransaction(async (tx) => {
    const visitorRows = await tx.query(
      `
        SELECT id, status
        FROM ${VISITOR_TABLE}
        WHERE id = ?
          AND org_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [visitorId, orgId]
    );

    const visitor = visitorRows[0];

    if (!visitor || visitor.status !== "checked_in") {
      return null;
    }

    const result = await tx.query(
      `
        INSERT INTO ${PASS_TABLE}
        (
          org_id,
          visitor_log_id,
          pass_code,
          status,
          issued_at,
          expires_at
        )
        VALUES (?, ?, ?, 'active', NOW(), ?)
      `,
      [orgId, visitorId, passCode, expiresAt]
    );

    const passRows = await tx.query(
      `
        SELECT
          id,
          org_id,
          visitor_log_id,
          pass_code,
          status,
          issued_at,
          expires_at,
          revoked_at,
          created_at,
          updated_at
        FROM ${PASS_TABLE}
        WHERE id = ?
          AND org_id = ?
        LIMIT 1
      `,
      [result.insertId, orgId]
    );

    return passRows[0] ?? null;
  });
}

/**
 * Revoke active passes for a visitor.
 */
export async function revokeVisitorPasses(orgId, visitorId) {
  return query(
    `
      UPDATE ${PASS_TABLE}
      SET
        status = 'revoked',
        revoked_at = NOW()
      WHERE visitor_log_id = ?
        AND org_id = ?
        AND status = 'active'
    `,
    [visitorId, orgId]
  );
}