/**
 * Visitor Notification Service
 *
 * This service defines the module-side notification boundary.
 *
 * Production integration can connect this to EduSuite's shared
 * notification/communication infrastructure.
 */

export async function notifyHostOfVisitor(visitor) {
  if (!visitor) {
    return {
      delivered: false,
      reason: "visitor_missing",
    };
  }

  const notification = {
    type: "visitor_arrived",
    visitorId: visitor.id,
    visitorName: visitor.visitor_name,
    hostId: visitor.host_id,
    hostName: visitor.host_name,
    purpose: visitor.purpose,
    checkInAt: visitor.check_in_at,
  };

  console.log(
    "[VISITOR NOTIFICATION]",
    JSON.stringify(notification)
  );

  return {
    delivered: false,
    queuedLocally: true,
    reason: "platform_notification_service_not_connected",
    notification,
  };
}