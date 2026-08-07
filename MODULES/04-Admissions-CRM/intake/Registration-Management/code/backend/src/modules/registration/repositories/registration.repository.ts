import { PoolConnection } from "mariadb";
import { pool } from "../../../config/database.js";
import {
  CreateRegistrationInput,
  Registration,
  UpdateRegistrationInput,
} from "../types/registration.types.js";

interface RegistrationRow {
  id: number;
  organization_id: number;
  registration_number: string;
  academic_session: string;

  student_first_name: string;
  student_middle_name: string | null;
  student_last_name: string;

  date_of_birth: string | null;
  gender: string | null;

  email: string | null;
  phone: string | null;

  guardian_name: string | null;
  guardian_phone: string | null;

  address_line: string | null;
  admission_class: string | null;

  status: Registration["status"];
  notes: string | null;

  created_by: number | null;
  updated_by: number | null;

  created_at: Date;
  updated_at: Date;
}

function mapRow(row: RegistrationRow): Registration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    registrationNumber: row.registration_number,
    academicSession: row.academic_session,

    studentFirstName: row.student_first_name,
    studentMiddleName: row.student_middle_name,
    studentLastName: row.student_last_name,

    dateOfBirth: row.date_of_birth,
    gender: row.gender,

    email: row.email,
    phone: row.phone,

    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,

    addressLine: row.address_line,
    admissionClass: row.admission_class,

    status: row.status,
    notes: row.notes,

    createdBy: row.created_by,
    updatedBy: row.updated_by,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectColumns = `
  SELECT
    id,
    organization_id,
    registration_number,
    academic_session,

    student_first_name,
    student_middle_name,
    student_last_name,

    date_of_birth,
    gender,

    email,
    phone,

    guardian_name,
    guardian_phone,

    address_line,
    admission_class,

    status,
    notes,

    created_by,
    updated_by,

    created_at,
    updated_at
  FROM client_registrations
`;

export async function findAll(
  organizationId: number,
): Promise<Registration[]> {
  const rows = await pool.query<RegistrationRow[]>(
    `
      ${selectColumns}
      WHERE organization_id = ?
      ORDER BY created_at DESC
    `,
    [organizationId],
  );

  return rows.map(mapRow);
}

export async function findById(
  organizationId: number,
  registrationId: number,
): Promise<Registration | null> {
  const rows = await pool.query<RegistrationRow[]>(
    `
      ${selectColumns}
      WHERE organization_id = ?
        AND id = ?
      LIMIT 1
    `,
    [organizationId, registrationId],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function insertRegistration(
  connection: PoolConnection,
  organizationId: number,
  registrationNumber: string,
  input: CreateRegistrationInput,
): Promise<number> {
  const result = await connection.query(
    `
      INSERT INTO client_registrations (
        organization_id,
        registration_number,
        academic_session,

        student_first_name,
        student_middle_name,
        student_last_name,

        date_of_birth,
        gender,

        email,
        phone,

        guardian_name,
        guardian_phone,

        address_line,
        admission_class,

        status,
        notes,
        created_by
      )
      VALUES (
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?
      )
    `,
    [
      organizationId,
      registrationNumber,
      input.academicSession,

      input.studentFirstName,
      input.studentMiddleName ?? null,
      input.studentLastName,

      input.dateOfBirth ?? null,
      input.gender ?? null,

      input.email ?? null,
      input.phone ?? null,

      input.guardianName ?? null,
      input.guardianPhone ?? null,

      input.addressLine ?? null,
      input.admissionClass ?? null,

      input.status ?? "draft",
      input.notes ?? null,
      input.createdBy ?? null,
    ],
  );

  return Number(result.insertId);
}

export async function updateById(
  organizationId: number,
  registrationId: number,
  input: UpdateRegistrationInput,
): Promise<boolean> {
  const mapping: Record<
    keyof UpdateRegistrationInput,
    string
  > = {
    academicSession: "academic_session",
    studentFirstName: "student_first_name",
    studentMiddleName: "student_middle_name",
    studentLastName: "student_last_name",
    dateOfBirth: "date_of_birth",
    gender: "gender",
    email: "email",
    phone: "phone",
    guardianName: "guardian_name",
    guardianPhone: "guardian_phone",
    addressLine: "address_line",
    admissionClass: "admission_class",
    status: "status",
    notes: "notes",
    updatedBy: "updated_by",
  };

  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    return false;
  }

  const setClause = entries
    .map(([key]) => `${mapping[key as keyof UpdateRegistrationInput]} = ?`)
    .join(", ");

  const values = entries.map(([, value]) => value);

  const result = await pool.query(
    `
      UPDATE client_registrations
      SET ${setClause}
      WHERE organization_id = ?
        AND id = ?
    `,
    [...values, organizationId, registrationId],
  );

  return Number(result.affectedRows) > 0;
}