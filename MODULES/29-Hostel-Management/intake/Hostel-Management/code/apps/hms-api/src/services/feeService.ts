import { db } from '../db';
import { config } from '../config';
import { randomUUID } from 'crypto';

export class FeeService {
  async createRentCharge(orgId: string, studentId: string, rentTier: string, allocationId: string) {
    // Get rent amount based on tier
    const rentAmount = this.getRentAmount(rentTier);

    // Generate idempotency key
    const idempotencyKey = `hms:alloc:${allocationId}`;

    // In production, call APEX Fee Module API
    // For now, mock the response
    const mockLedgerId = randomUUID();

    // Store fee charge record
    await db
      .insertInto('hms.fee_charge')
      .values({
        org_id: orgId,
        apex_student_id: studentId,
        apex_ledger_id: mockLedgerId,
        charge_type: 'rent',
        amount_paise: rentAmount,
        period_start: new Date(),
        period_end: new Date(),
        allocation_id: allocationId,
        idempotency_key: idempotencyKey,
        posted_at: new Date(),
      })
      .execute();

    return {
      amountPaise: rentAmount,
      ledgerId: mockLedgerId,
    };
  }

  async createDamageCharge(orgId: string, studentId: string, amountPaise: number, allocationId: string) {
    const idempotencyKey = `hms:damage:${allocationId}:${Date.now()}`;

    // In production, call APEX Fee Module API
    const mockLedgerId = randomUUID();

    await db
      .insertInto('hms.fee_charge')
      .values({
        org_id: orgId,
        apex_student_id: studentId,
        apex_ledger_id: mockLedgerId,
        charge_type: 'damage',
        amount_paise: amountPaise,
        allocation_id: allocationId,
        idempotency_key: idempotencyKey,
        posted_at: new Date(),
      })
      .execute();

    return {
      amountPaise,
      ledgerId: mockLedgerId,
    };
  }

  async getStudentBalance(orgId: string, studentId: string): Promise<{ duePaise: number; cleared: boolean }> {
    // In production, call APEX Fee Module API
    // Mock response
    return {
      duePaise: 0,
      cleared: true,
    };
  }

  private getRentAmount(rentTier: string): number {
    const rentTiers: Record<string, number> = {
      standard: 500000, // 5000 INR in paise
      premium: 750000,  // 7500 INR in paise
      luxury: 1000000,  // 10000 INR in paise
    };

    return rentTiers[rentTier] || 500000;
  }

  // Process refund when student vacates
  async processRefund(orgId: string, studentId: string, allocationId: string): Promise<number> {
    // Calculate total deposits minus damage charges
    const deposits = await db
      .selectFrom('hms.fee_charge')
      .select(db.fn.sum('amount_paise').as('total'))
      .where('org_id', '=', orgId)
      .where('apex_student_id', '=', studentId)
      .where('allocation_id', '=', allocationId)
      .where('charge_type', '=', 'deposit')
      .executeTakeFirst();

    const damages = await db
      .selectFrom('hms.fee_charge')
      .select(db.fn.sum('amount_paise').as('total'))
      .where('org_id', '=', orgId)
      .where('apex_student_id', '=', studentId)
      .where('allocation_id', '=', allocationId)
      .where('charge_type', '=', 'damage')
      .executeTakeFirst();

    const depositTotal = Number(deposits?.total || 0);
    const damageTotal = Number(damages?.total || 0);
    const refundAmount = depositTotal - damageTotal;

    if (refundAmount > 0) {
      // Post refund charge to APEX
      const idempotencyKey = `hms:refund:${allocationId}:${Date.now()}`;
      const mockLedgerId = randomUUID();

      await db
        .insertInto('hms.fee_charge')
        .values({
          org_id: orgId,
          apex_student_id: studentId,
          apex_ledger_id: mockLedgerId,
          charge_type: 'refund',
          amount_paise: refundAmount,
          allocation_id: allocationId,
          idempotency_key: idempotencyKey,
          posted_at: new Date(),
        })
        .execute();
    }

    return refundAmount;
  }
}

export const feeService = new FeeService();