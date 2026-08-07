import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  createRegistration,
  getRegistration,
  listRegistrations,
  updateRegistration,
} from "../services/registration.service.js";
import {
  parsePositiveId,
  validateCreateRegistration,
  validateUpdateRegistration,
} from "../validators/registration.validator.js";

function organizationId(req: Request): number {
  if (!req.organizationId) {
    throw new AppError(
      "Organization context is unavailable.",
      500,
    );
  }

  return req.organizationId;
}

export async function listRegistrationsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listRegistrations(
      organizationId(req),
    );

    sendSuccess(
      res,
      data,
      "Registrations retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

export async function getRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parsePositiveId(
      req.params.id ?? "",
      "registration id",
    );

    const data = await getRegistration(
      organizationId(req),
      id,
    );

    sendSuccess(
      res,
      data,
      "Registration retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

export async function createRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = validateCreateRegistration(
      req.body as Record<string, unknown>,
    );

    const data = await createRegistration(
      organizationId(req),
      input,
    );

    sendSuccess(
      res,
      data,
      "Registration created successfully.",
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parsePositiveId(
      req.params.id ?? "",
      "registration id",
    );

    const input = validateUpdateRegistration(
      req.body as Record<string, unknown>,
    );

    const data = await updateRegistration(
      organizationId(req),
      id,
      input,
    );

    sendSuccess(
      res,
      data,
      "Registration updated successfully.",
    );
  } catch (error) {
    next(error);
  }
}