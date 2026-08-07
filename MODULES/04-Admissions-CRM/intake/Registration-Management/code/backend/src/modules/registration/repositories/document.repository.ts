import { pool } from "../../../config/database.js";

import {
  CreateDocumentInput,
  RegistrationDocument,
  UpdateDocumentInput,
} from "../types/registration.types.js";

interface DocumentRow {
  id: number;
  organization_id: number;
  registration_id: number;

  document_type: string;
  document_name: string;

  is_required: number | boolean;
  status: RegistrationDocument["status"];

  file_reference: string | null;
  remarks: string | null;

  verified_by: number | null;
  verified_at: Date | null;

  created_at: Date;
  updated_at: Date;
}

function mapRow(
  row: DocumentRow,
): RegistrationDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    registrationId: row.registration_id,

    documentType: row.document_type,
    documentName: row.document_name,

    isRequired: Boolean(row.is_required),
    status: row.status,

    fileReference: row.file_reference,
    remarks: row.remarks,

    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectColumns = `
  SELECT
    id,
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status,
    file_reference,
    remarks,
    verified_by,
    verified_at,
    created_at,
    updated_at
  FROM client_registration_documents
`;

export async function findDocuments(
  organizationId: number,
  registrationId: number,
): Promise<RegistrationDocument[]> {
  const rows = await pool.query<DocumentRow[]>(
    `
      ${selectColumns}
      WHERE organization_id = ?
        AND registration_id = ?
      ORDER BY document_name ASC
    `,
    [
      organizationId,
      registrationId,
    ],
  );

  return rows.map(mapRow);
}

export async function findDocumentById(
  organizationId: number,
  registrationId: number,
  documentId: number,
): Promise<RegistrationDocument | null> {
  const rows = await pool.query<DocumentRow[]>(
    `
      ${selectColumns}
      WHERE organization_id = ?
        AND registration_id = ?
        AND id = ?
      LIMIT 1
    `,
    [
      organizationId,
      registrationId,
      documentId,
    ],
  );

  return rows[0]
    ? mapRow(rows[0])
    : null;
}

export async function createDocument(
  organizationId: number,
  registrationId: number,
  input: CreateDocumentInput,
): Promise<number> {
  const verified =
    input.status === "verified";

  const result = await pool.query(
    `
      INSERT INTO client_registration_documents (
        organization_id,
        registration_id,
        document_type,
        document_name,
        is_required,
        status,
        file_reference,
        remarks,
        verified_by,
        verified_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      organizationId,
      registrationId,

      input.documentType,
      input.documentName,

      input.isRequired ?? true,
      input.status ?? "pending",

      input.fileReference ?? null,
      input.remarks ?? null,

      input.verifiedBy ?? null,
      verified ? new Date() : null,
    ],
  );

  return Number(result.insertId);
}

export async function updateDocument(
  organizationId: number,
  registrationId: number,
  documentId: number,
  input: UpdateDocumentInput,
): Promise<boolean> {
  const mapping: Record<
    keyof UpdateDocumentInput,
    string
  > = {
    documentName: "document_name",
    isRequired: "is_required",
    status: "status",
    fileReference: "file_reference",
    remarks: "remarks",
    verifiedBy: "verified_by",
  };

  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    return false;
  }

  const assignments = entries.map(
    ([key]) =>
      `${
        mapping[
          key as keyof UpdateDocumentInput
        ]
      } = ?`,
  );

  const values = entries.map(
    ([, value]) => value,
  );

  if (input.status === "verified") {
  assignments.push("verified_at = NOW()");
} else if (input.status !== undefined) {
  assignments.push("verified_at = NULL");
}

  const result = await pool.query(
    `
      UPDATE client_registration_documents
      SET ${assignments.join(", ")}
      WHERE organization_id = ?
        AND registration_id = ?
        AND id = ?
    `,
    [
      ...values,
      organizationId,
      registrationId,
      documentId,
    ],
  );

  return Number(result.affectedRows) > 0;
}