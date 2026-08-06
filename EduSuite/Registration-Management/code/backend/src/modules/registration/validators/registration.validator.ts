import {
  CreateDocumentInput,
  CreateRegistrationInput,
  DocumentStatus,
  RegistrationStatus,
  UpdateDocumentInput,
  UpdateRegistrationInput,
} from "../types/registration.types.js";
import { AppError } from "../../../middleware/error.middleware.js";

const registrationStatuses: RegistrationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "cancelled",
];

const documentStatuses: DocumentStatus[] = [
  "pending",
  "submitted",
  "verified",
  "rejected",
];

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required.`, 400);
  }

  return value.trim();
}

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("Expected a text value.", 400);
  }

  return value.trim();
}

export function validateCreateRegistration(
  body: Record<string, unknown>,
): CreateRegistrationInput {
  const status =
    body.status === undefined
      ? "draft"
      : requireText(body.status, "status");

  if (!registrationStatuses.includes(status as RegistrationStatus)) {
    throw new AppError("Invalid registration status.", 400);
  }

  return {
    academicSession: requireText(
      body.academicSession,
      "academicSession",
    ),

    studentFirstName: requireText(
      body.studentFirstName,
      "studentFirstName",
    ),

    studentMiddleName: optionalText(body.studentMiddleName),

    studentLastName: requireText(
      body.studentLastName,
      "studentLastName",
    ),

    dateOfBirth: optionalText(body.dateOfBirth),
    gender: optionalText(body.gender),

    email: optionalText(body.email),
    phone: optionalText(body.phone),

    guardianName: optionalText(body.guardianName),
    guardianPhone: optionalText(body.guardianPhone),

    addressLine: optionalText(body.addressLine),
    admissionClass: optionalText(body.admissionClass),

    status: status as RegistrationStatus,
    notes: optionalText(body.notes),

    createdBy:
      typeof body.createdBy === "number"
        ? body.createdBy
        : null,
  };
}

export function validateUpdateRegistration(
  body: Record<string, unknown>,
): UpdateRegistrationInput {
  const result: UpdateRegistrationInput = {};

  if (body.academicSession !== undefined) {
    result.academicSession = requireText(
      body.academicSession,
      "academicSession",
    );
  }

  if (body.studentFirstName !== undefined) {
    result.studentFirstName = requireText(
      body.studentFirstName,
      "studentFirstName",
    );
  }

  if (body.studentMiddleName !== undefined) {
    result.studentMiddleName = optionalText(body.studentMiddleName);
  }

  if (body.studentLastName !== undefined) {
    result.studentLastName = requireText(
      body.studentLastName,
      "studentLastName",
    );
  }

  if (body.dateOfBirth !== undefined) {
    result.dateOfBirth = optionalText(body.dateOfBirth);
  }

  if (body.gender !== undefined) {
    result.gender = optionalText(body.gender);
  }

  if (body.email !== undefined) {
    result.email = optionalText(body.email);
  }

  if (body.phone !== undefined) {
    result.phone = optionalText(body.phone);
  }

  if (body.guardianName !== undefined) {
    result.guardianName = optionalText(body.guardianName);
  }

  if (body.guardianPhone !== undefined) {
    result.guardianPhone = optionalText(body.guardianPhone);
  }

  if (body.addressLine !== undefined) {
    result.addressLine = optionalText(body.addressLine);
  }

  if (body.admissionClass !== undefined) {
    result.admissionClass = optionalText(body.admissionClass);
  }

  if (body.status !== undefined) {
    const status = requireText(body.status, "status");

    if (!registrationStatuses.includes(status as RegistrationStatus)) {
      throw new AppError("Invalid registration status.", 400);
    }

    result.status = status as RegistrationStatus;
  }

  if (body.notes !== undefined) {
    result.notes = optionalText(body.notes);
  }

  if (typeof body.updatedBy === "number") {
    result.updatedBy = body.updatedBy;
  }

  if (Object.keys(result).length === 0) {
    throw new AppError(
      "At least one registration field must be provided.",
      400,
    );
  }

  return result;
}

export function validateCreateDocument(
  body: Record<string, unknown>,
): CreateDocumentInput {
  const status =
    body.status === undefined
      ? "pending"
      : requireText(body.status, "status");

  if (!documentStatuses.includes(status as DocumentStatus)) {
    throw new AppError("Invalid document status.", 400);
  }

  return {
    documentType: requireText(
      body.documentType,
      "documentType",
    ),

    documentName: requireText(
      body.documentName,
      "documentName",
    ),

    isRequired:
      typeof body.isRequired === "boolean"
        ? body.isRequired
        : true,

    status: status as DocumentStatus,

    fileReference: optionalText(body.fileReference),
    remarks: optionalText(body.remarks),

    verifiedBy:
      typeof body.verifiedBy === "number"
        ? body.verifiedBy
        : null,
  };
}

export function validateUpdateDocument(
  body: Record<string, unknown>,
): UpdateDocumentInput {
  const result: UpdateDocumentInput = {};

  if (body.documentName !== undefined) {
    result.documentName = requireText(
      body.documentName,
      "documentName",
    );
  }

  if (typeof body.isRequired === "boolean") {
    result.isRequired = body.isRequired;
  }

  if (body.status !== undefined) {
    const status = requireText(body.status, "status");

    if (!documentStatuses.includes(status as DocumentStatus)) {
      throw new AppError("Invalid document status.", 400);
    }

    result.status = status as DocumentStatus;
  }

  if (body.fileReference !== undefined) {
    result.fileReference = optionalText(body.fileReference);
  }

  if (body.remarks !== undefined) {
    result.remarks = optionalText(body.remarks);
  }

  if (typeof body.verifiedBy === "number") {
    result.verifiedBy = body.verifiedBy;
  }

  if (Object.keys(result).length === 0) {
    throw new AppError(
      "At least one document field must be provided.",
      400,
    );
  }

  return result;
}

export function parsePositiveId(
  value: string | string[] | undefined,
  field = "id",
): number {
  const normalizedValue = Array.isArray(value)
    ? value[0]
    : value;

  if (!normalizedValue) {
    throw new AppError(
      `${field} is required.`,
      400,
    );
  }

  const parsed = Number(normalizedValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(
      `${field} must be a positive integer.`,
      400,
    );
  }

  return parsed;
}