import { AppError } from "../../../middleware/error.middleware.js";
import {
  createDocument as createDocumentRecord,
  findDocumentById,
  findDocuments,
  updateDocument as updateDocumentRecord,
} from "../repositories/document.repository.js";
import {
  CreateDocumentInput,
  RegistrationDocument,
  UpdateDocumentInput,
} from "../types/registration.types.js";
import { getRegistration } from "./registration.service.js";

export async function listDocuments(
  organizationId: number,
  registrationId: number,
): Promise<RegistrationDocument[]> {
  await getRegistration(
    organizationId,
    registrationId,
  );

  return findDocuments(
    organizationId,
    registrationId,
  );
}

export async function createDocument(
  organizationId: number,
  registrationId: number,
  input: CreateDocumentInput,
): Promise<RegistrationDocument> {
  await getRegistration(
    organizationId,
    registrationId,
  );

  try {
    const documentId = await createDocumentRecord(
      organizationId,
      registrationId,
      input,
    );

    const document = await findDocumentById(
      organizationId,
      registrationId,
      documentId,
    );

    if (!document) {
      throw new AppError(
        "Document was created but could not be retrieved.",
        500,
      );
    }

    return document;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new AppError(
        "This document type already exists for the registration.",
        409,
      );
    }

    throw error;
  }
}

export async function updateDocument(
  organizationId: number,
  registrationId: number,
  documentId: number,
  input: UpdateDocumentInput,
): Promise<RegistrationDocument> {
  await getRegistration(
    organizationId,
    registrationId,
  );

  const existing = await findDocumentById(
    organizationId,
    registrationId,
    documentId,
  );

  if (!existing) {
    throw new AppError(
      "Registration document not found.",
      404,
    );
  }

  await updateDocumentRecord(
    organizationId,
    registrationId,
    documentId,
    input,
  );

  const updated = await findDocumentById(
    organizationId,
    registrationId,
    documentId,
  );

  if (!updated) {
    throw new AppError(
      "Updated document could not be retrieved.",
      500,
    );
  }

  return updated;
}