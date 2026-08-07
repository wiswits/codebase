import {
  cancelVisitor,
  checkoutVisitor,
  countVisitors,
  createVisitor,
  findVisitorById,
  findVisitors,
  revokeVisitorPasses,
} from "./visitor.repository.js";

import {
  generateVisitorPass,
  getVisitorPass,
} from "./visitor-pass.service.js";

import {
  notifyHostOfVisitor,
} from "./visitor-notification.service.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

export async function listVisitors(orgId, filters) {
  const [items, total] = await Promise.all([
    findVisitors(orgId, filters),
    countVisitors(orgId, filters),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / filters.limit),
    },
  };
}

export async function getVisitor(orgId, visitorId) {
  const visitor = await findVisitorById(
    orgId,
    visitorId
  );

  if (!visitor) {
    throw createHttpError(404, "Visitor not found.");
  }

  const pass = await getVisitorPass(
    orgId,
    visitorId
  );

  return {
    ...visitor,
    pass,
  };
}

export async function checkInVisitor(
  orgId,
  actorId,
  data
) {
  const visitor = await createVisitor(
    orgId,
    actorId,
    data
  );

  // Notification failure must not roll back check-in.
  let notification = null;

  try {
    notification =
      await notifyHostOfVisitor(visitor);
  } catch (error) {
    console.error(
      "Host notification failed:",
      error.message
    );
  }

  return {
    visitor,
    notification,
  };
}

export async function issueVisitorPass(
  orgId,
  visitorId,
  expiresAt = null
) {
  return generateVisitorPass(
    orgId,
    visitorId,
    expiresAt
  );
}

export async function checkOutVisitor(
  orgId,
  visitorId,
  actorId
) {
  const existing = await findVisitorById(
    orgId,
    visitorId
  );

  if (!existing) {
    throw createHttpError(
      404,
      "Visitor not found."
    );
  }

  if (existing.status !== "checked_in") {
    throw createHttpError(
      409,
      "Only checked-in visitors can be checked out."
    );
  }

  const visitor = await checkoutVisitor(
    orgId,
    visitorId,
    actorId
  );

  if (!visitor) {
    throw createHttpError(
      409,
      "Visitor checkout could not be completed."
    );
  }

  await revokeVisitorPasses(
    orgId,
    visitorId
  );

  return visitor;
}

export async function cancelVisitorEntry(
  orgId,
  visitorId
) {
  const existing = await findVisitorById(
    orgId,
    visitorId
  );

  if (!existing) {
    throw createHttpError(
      404,
      "Visitor not found."
    );
  }

  if (existing.status !== "checked_in") {
    throw createHttpError(
      409,
      "Only checked-in visitor entries can be cancelled."
    );
  }

  const visitor = await cancelVisitor(
    orgId,
    visitorId
  );

  if (!visitor) {
    throw createHttpError(
      409,
      "Visitor entry could not be cancelled."
    );
  }

  await revokeVisitorPasses(
    orgId,
    visitorId
  );

  return visitor;
}