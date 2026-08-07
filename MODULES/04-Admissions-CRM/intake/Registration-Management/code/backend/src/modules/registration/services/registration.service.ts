import { PoolConnection } from "mariadb";
import { pool } from "../../../config/database.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  findAll,
  findById,
  insertRegistration,
  updateById,
} from "../repositories/registration.repository.js";
import {
  CreateRegistrationInput,
  Registration,
  UpdateRegistrationInput,
} from "../types/registration.types.js";
import { allocateRegistrationNumber } from "./registration-number.service.js";

export async function listRegistrations(
  organizationId: number,
): Promise<Registration[]> {
  return findAll(organizationId);
}

export async function getRegistration(
  organizationId: number,
  registrationId: number,
): Promise<Registration> {
  const registration = await findById(
    organizationId,
    registrationId,
  );

  if (!registration) {
    throw new AppError("Registration not found.", 404);
  }

  return registration;
}

export async function createRegistration(
  organizationId: number,
  input: CreateRegistrationInput,
): Promise<Registration> {
  let connection: PoolConnection | undefined;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    const registrationNumber =
      await allocateRegistrationNumber(
        connection,
        organizationId,
        input.academicSession,
      );

    const registrationId = await insertRegistration(
      connection,
      organizationId,
      registrationNumber,
      input,
    );

    await connection.commit();

    return await getRegistration(
      organizationId,
      registrationId,
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original error.
      }
    }

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function updateRegistration(
  organizationId: number,
  registrationId: number,
  input: UpdateRegistrationInput,
): Promise<Registration> {
  await getRegistration(
    organizationId,
    registrationId,
  );

  await updateById(
    organizationId,
    registrationId,
    input,
  );

  return getRegistration(
    organizationId,
    registrationId,
  );
}