import { randomUUID } from 'crypto';
import { db } from '../db';

export class IdempotencyKey {
  constructor(
    public readonly key: string,
    public readonly timestamp: number = Date.now()
  ) {}

  static generate(prefix: string = 'hms'): IdempotencyKey {
    const uuid = randomUUID();
    return new IdempotencyKey(`${prefix}:${uuid}`);
  }

  static fromString(key: string): IdempotencyKey {
    const parts = key.split(':');
    if (parts.length < 2) {
      throw new Error('Invalid idempotency key format');
    }
    return new IdempotencyKey(key);
  }

  toString(): string {
    return this.key;
  }

  toBase64(): string {
    return Buffer.from(this.key).toString('base64');
  }

  static fromBase64(encoded: string): IdempotencyKey {
    const decoded = Buffer.from(encoded, 'base64').toString();
    return IdempotencyKey.fromString(decoded);
  }
}

// Generate idempotency key for a specific operation
export function generateIdempotencyKey(
  operation: string,
  identifier: string,
  prefix: string = 'hms'
): string {
  return `${prefix}:${operation}:${identifier}:${Date.now()}`;
}

// Check if an idempotent operation has already been processed
export async function checkIdempotency(
  tableName: string,
  idempotencyKey: string,
  orgId: string
): Promise<boolean> {
  try {
    const result = await db
      .selectFrom(tableName as any)
      .select('id')
      .where('idempotency_key', '=', idempotencyKey)
      .where('org_id', '=', orgId)
      .executeTakeFirst();
    return !!result;
  } catch {
    return false;
  }
}

// Store idempotency record
export async function storeIdempotencyRecord(
  tableName: string,
  idempotencyKey: string,
  orgId: string,
  data: Record<string, any>
): Promise<void> {
  await db
    .insertInto(tableName as any)
    .values({
      idempotency_key: idempotencyKey,
      org_id: orgId,
      ...data,
    })
    .execute();
}

// Idempotency guard - ensures an operation is only executed once
export function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>
): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return async function(): Promise<T> {
    // If operation is already in flight, return the existing promise
    if (inFlight) {
      return inFlight;
    }

    // Check if already completed (in memory cache)
    const cacheKey = `idempotency:${key}`;
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      return cached as T;
    }

    // Execute operation
    inFlight = operation();

    try {
      const result = await inFlight;
      // Cache result
      await cacheResult(cacheKey, result);
      return result;
    } finally {
      inFlight = null;
    }
  };
}

// Simple in-memory cache for idempotency
// In production, use Redis
const idempotencyCache = new Map<string, { result: any; timestamp: number }>();

async function getCachedResult(key: string): Promise<any | null> {
  const cached = idempotencyCache.get(key);
  if (cached) {
    // Expire after 24 hours
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
      idempotencyCache.delete(key);
      return null;
    }
    return cached.result;
  }
  return null;
}

async function cacheResult(key: string, result: any): Promise<void> {
  idempotencyCache.set(key, { result, timestamp: Date.now() });
}

// Generate idempotency key for fee charges
export function generateFeeIdempotencyKey(
  allocationId: string,
  chargeType: string
): string {
  return generateIdempotencyKey('fee', `${allocationId}:${chargeType}`);
}

// Generate idempotency key for attendance
export function generateAttendanceIdempotencyKey(
  studentId: string,
  date: string
): string {
  return generateIdempotencyKey('attendance', `${studentId}:${date}`);
}

// Generate idempotency key for leave
export function generateLeaveIdempotencyKey(
  studentId: string,
  fromDate: string,
  toDate: string
): string {
  return generateIdempotencyKey('leave', `${studentId}:${fromDate}:${toDate}`);
}