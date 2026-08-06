import crypto from "node:crypto";

import {
  createPass,
  findPassByVisitorId,
  findVisitorById,
  revokeVisitorPasses,
} from "./visitor.repository.js";

function generatePassCode() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `VIS-${date}-${random}`;
}

export async function getVisitorPass(orgId, visitorId) {
  return findPassByVisitorId(orgId, visitorId);
}

export async function generateVisitorPass(
  orgId,
  visitorId,
  expiresAt = null
) {
  const visitor = await findVisitorById(orgId, visitorId);

  if (!visitor) {
    const error = new Error("Visitor not found.");
    error.statusCode = 404;
    throw error;
  }

  if (visitor.status !== "checked_in") {
    const error = new Error(
      "A pass can only be generated for a checked-in visitor."
    );

    error.statusCode = 409;
    throw error;
  }

  const existingPass = await findPassByVisitorId(
    orgId,
    visitorId
  );

  if (existingPass?.status === "active") {
    return existingPass;
  }

  const passCode = generatePassCode();

  const pass = await createPass(
    orgId,
    visitorId,
    passCode,
    expiresAt
  );

  if (!pass) {
    const error = new Error(
      "Visitor pass could not be generated."
    );

    error.statusCode = 409;
    throw error;
  }

  return pass;
}

export async function revokePassesForVisitor(
  orgId,
  visitorId
) {
  return revokeVisitorPasses(orgId, visitorId);
}