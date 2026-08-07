import { PoolConnection } from "mariadb";

interface SeriesRow {
  id: number;
  organization_id: number;
  academic_session: string;
  prefix: string;
  current_sequence: number;
}

export async function findSeriesForUpdate(
  connection: PoolConnection,
  organizationId: number,
  academicSession: string,
): Promise<SeriesRow | null> {
  const rows = await connection.query<SeriesRow[]>(
    `
      SELECT
        id,
        organization_id,
        academic_session,
        prefix,
        current_sequence
      FROM client_registration_number_series
      WHERE organization_id = ?
        AND academic_session = ?
      FOR UPDATE
    `,
    [organizationId, academicSession],
  );

  return rows[0] ?? null;
}

export async function createSeries(
  connection: PoolConnection,
  organizationId: number,
  academicSession: string,
  prefix: string,
): Promise<number> {
  const result = await connection.query(
    `
      INSERT INTO client_registration_number_series (
        organization_id,
        academic_session,
        prefix,
        current_sequence
      )
      VALUES (?, ?, ?, 0)
    `,
    [organizationId, academicSession, prefix],
  );

  return Number(result.insertId);
}

export async function incrementSeries(
  connection: PoolConnection,
  seriesId: number,
): Promise<void> {
  await connection.query(
    `
      UPDATE client_registration_number_series
      SET current_sequence = current_sequence + 1
      WHERE id = ?
    `,
    [seriesId],
  );
}

export async function getSeriesSequence(
  connection: PoolConnection,
  seriesId: number,
): Promise<number> {
  const rows = await connection.query<
    Array<{ current_sequence: number }>
  >(
    `
      SELECT current_sequence
      FROM client_registration_number_series
      WHERE id = ?
    `,
    [seriesId],
  );

  return Number(rows[0]?.current_sequence ?? 0);
}