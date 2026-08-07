/**
 * LOCAL INTEGRATION ADAPTER
 *
 * Production:
 * Replace with WisWits's shared audit implementation.
 *
 * The Visitor module already calls audit() at mutation points,
 * so the business code will not need to be redesigned later.
 */

export async function audit(req, action, entityType, entityId, metadata = {}) {
  const event = {
    action,
    entity_type: entityType,
    entity_id: entityId,
    org_id: req.user?.org_id ?? null,
    user_id: req.user?.id ?? null,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Local development visibility only.
  console.log("[AUDIT]", JSON.stringify(event));

  return event;
}