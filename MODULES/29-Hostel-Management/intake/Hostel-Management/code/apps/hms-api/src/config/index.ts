import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(4000),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  requestIdHeader: z.string().default('x-request-id'),
  trustProxy: z.boolean().default(true),
  
  // Database
  databaseUrl: z.string().min(1),
  databasePoolMin: z.coerce.number().default(2),
  databasePoolMax: z.coerce.number().default(10),
  databaseIdleTimeout: z.coerce.number().default(30000),
  
  // Redis
  redisUrl: z.string().default('redis://localhost:6379'),
  redisPassword: z.string().optional(),
  redisDb: z.coerce.number().default(0),
  
  // JWT
  jwtPublicKey: z.string().min(1),
  jwtAudience: z.string().default('hms'),
  jwtIssuer: z.string().default('apex-os'),
  jwtAlgorithms: z.array(z.string()).default(['RS256']),
  apexJwksUrl: z.string().url().default('http://localhost:3000/.well-known/jwks.json'),
  
  // APEX Integration
  apexFeeApiUrl: z.string().url().default('http://localhost:3000/apex/v1/fees'),
  apexNotificationApiUrl: z.string().url().default('http://localhost:3000/apex/v1/notifications'),
  apexStudentApiUrl: z.string().url().default('http://localhost:3000/apex/v1/students'),
  
  // S3
  s3Endpoint: z.string().default('http://localhost:9000'),
  s3AccessKey: z.string().min(1),
  s3SecretKey: z.string().min(1),
  s3Bucket: z.string().default('hms-complaints'),
  s3Region: z.string().default('us-east-1'),
  s3ForcePathStyle: z.boolean().default(true),
  
  // Rate Limiting
  rateLimitWindow: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(100),
  
  // Security
  corsOrigin: z.string().default('http://localhost:5173'),
  corsCredentials: z.boolean().default(true),
  helmetEnabled: z.boolean().default(true),
  
  // Features
  parentApprovalDefault: z.boolean().default(true),
  attendanceCutoffTime: z.string().default('22:00'),
  qrAttendanceEnabled: z.boolean().default(false),
  autoCloseComplaintDays: z.coerce.number().default(7),
  bedReservationTtlHours: z.coerce.number().default(24),
  
  // Audit
  auditEnabled: z.boolean().default(true),
  auditLogLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;