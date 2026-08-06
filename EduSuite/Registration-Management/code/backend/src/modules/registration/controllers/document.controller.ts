import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  createDocument,
  listDocuments,
  updateDocument,
} from "../services/document.service.js";
import {
  parsePositiveId,
  validateCreateDocument,
  validateUpdateDocument,
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

export async function listDocumentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const registrationId = parsePositiveId(
      req.params.id ?? "",
      "registration id",
    );

    const data = await listDocuments(
      organizationId(req),
      registrationId,
    );

    sendSuccess(
      res,
      data,
      "Registration documents retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

export async function createDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const registrationId = parsePositiveId(
      req.params.id ?? "",
      "registration id",
    );

    const input = validateCreateDocument(
      req.body as Record<string, unknown>,
    );

    const data = await createDocument(
      organizationId(req),
      registrationId,
      input,
    );

    sendSuccess(
      res,
      data,
      "Registration document created successfully.",
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const registrationId = parsePositiveId(
      req.params.id ?? "",
      "registration id",
    );

    const documentId = parsePositiveId(
      req.params.documentId ?? "",
      "document id",
    );

    const input = validateUpdateDocument(
      req.body as Record<string, unknown>,
    );

    const data = await updateDocument(
      organizationId(req),
      registrationId,
      documentId,
      input,
    );

    sendSuccess(
      res,
      data,
      "Registration document updated successfully.",
    );
  } catch (error) {
    next(error);
  }
}