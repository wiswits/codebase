import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function positiveInteger(value: string, name: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  port: positiveInteger(
    process.env.PORT ?? "5000",
    "PORT",
  ),

  corsOrigin:
    process.env.CORS_ORIGIN ?? "http://localhost:5173",

  database: {
    host: required("DB_HOST"),

    port: positiveInteger(
      process.env.DB_PORT ?? "3306",
      "DB_PORT",
    ),

    name: required("DB_NAME"),
    user: required("DB_USER"),

    password:
      process.env.DB_PASSWORD ?? "",

    connectionLimit: positiveInteger(
      process.env.DB_CONNECTION_LIMIT ?? "10",
      "DB_CONNECTION_LIMIT",
    ),
  },

  defaultOrganizationId: positiveInteger(
    process.env.DEFAULT_ORGANIZATION_ID ?? "12",
    "DEFAULT_ORGANIZATION_ID",
  ),
};