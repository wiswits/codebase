import { PoolConnection } from "mariadb";
import {
  createSeries,
  findSeriesForUpdate,
  getSeriesSequence,
  incrementSeries,
} from "../repositories/registration-number.repository.js";

function sessionYear(academicSession: string): string {
  const match = academicSession.match(/\d{4}/);

  if (!match) {
    throw new Error(
      "Academic session must contain a four-digit year.",
    );
  }

  return match[0];
}

function createPrefix(
  organizationId: number,
  academicSession: string,
): string {
  return `ORG${organizationId}-${sessionYear(academicSession)}`;
}

export async function allocateRegistrationNumber(
  connection: PoolConnection,
  organizationId: number,
  academicSession: string,
): Promise<string> {
  let series = await findSeriesForUpdate(
    connection,
    organizationId,
    academicSession,
  );

  if (!series) {
    const prefix = createPrefix(
      organizationId,
      academicSession,
    );

    try {
      await createSeries(
        connection,
        organizationId,
        academicSession,
        prefix,
      );
    } catch (error) {
      /*
       * Another concurrent transaction may have created the
       * organization/session series first.
       *
       * Re-read the canonical row.
       */
    }

    series = await findSeriesForUpdate(
      connection,
      organizationId,
      academicSession,
    );
  }

  if (!series) {
    throw new Error(
      "Unable to initialize registration number series.",
    );
  }

  await incrementSeries(connection, series.id);

  const sequence = await getSeriesSequence(
    connection,
    series.id,
  );

  const paddedSequence = String(sequence).padStart(4, "0");

  return `${series.prefix}-${paddedSequence}`;
}