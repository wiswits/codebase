import * as crypto from 'crypto';

// QR Code payload structure
export interface QRPayload {
  type: 'gatepass' | 'student';
  id: string;
  data: Record<string, any>;
  expiresAt?: number;
  signature?: string;
}

// QR Code generator class
export class QRGenerator {
  private static readonly SECRET = process.env.QR_SECRET || 'hms-qr-secret';
  private static readonly ALGORITHM = 'sha256';

  // Generate a QR code payload
  static generatePayload(
    type: QRPayload['type'],
    id: string,
    data: Record<string, any>,
    expiresInHours: number = 24
  ): QRPayload {
    const payload: QRPayload = {
      type,
      id,
      data,
      expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
    };

    // Sign the payload
    payload.signature = this.signPayload(payload);

    return payload;
  }

  // Sign the payload for verification
  static signPayload(payload: Omit<QRPayload, 'signature'>): string {
    const data = `${payload.type}:${payload.id}:${JSON.stringify(payload.data)}:${payload.expiresAt}`;
    return crypto
      .createHmac(this.ALGORITHM, this.SECRET)
      .update(data)
      .digest('hex');
  }

  // Verify a QR code payload
  static verifyPayload(payload: QRPayload): boolean {
    // Check expiration
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return false;
    }

    // Verify signature
    const { signature, ...data } = payload;
    const expectedSignature = this.signPayload(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expectedSignature)
    );
  }

  // Generate a gate pass QR code string
  static generateGatePassQR(
    passId: string,
    studentId: string,
    hostelId: string,
    validFrom: Date,
    validTo: Date
  ): string {
    const payload = this.generatePayload(
      'gatepass',
      passId,
      {
        studentId,
        hostelId,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
      },
      24 // 24 hours expiration
    );

    return this.encodePayload(payload);
  }

  // Generate a student QR code
  static generateStudentQR(studentId: string, orgId: string): string {
    const payload = this.generatePayload(
      'student',
      studentId,
      {
        orgId,
        studentId,
      },
      8760 // 1 year expiration
    );

    return this.encodePayload(payload);
  }

  // Encode payload to string (for QR code)
  static encodePayload(payload: QRPayload): string {
    // In production, this would use a more efficient encoding
    // For now, we'll use a simple JSON + base64 encoding
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
  }

  // Decode payload from string
  static decodePayload(encoded: string): QRPayload | null {
    try {
      const json = Buffer.from(encoded, 'base64').toString();
      const payload = JSON.parse(json) as QRPayload;
      return this.verifyPayload(payload) ? payload : null;
    } catch {
      return null;
    }
  }

  // Validate a gate pass QR code
  static validateGatePassQR(
    encoded: string
  ): {
    valid: boolean;
    payload?: QRPayload;
    error?: string;
  } {
    const payload = this.decodePayload(encoded);
    if (!payload) {
      return { valid: false, error: 'Invalid QR code format' };
    }

    if (payload.type !== 'gatepass') {
      return { valid: false, error: 'Invalid QR code type' };
    }

    // Check expiration
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, payload };
  }

  // Generate QR code URL (for display)
  static generateQRImageUrl(
    encoded: string,
    size: number = 200
  ): string {
    // In production, use a QR code generation API
    // For now, return a placeholder URL
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(encoded)}&size=${size}x${size}`;
  }
}

// Helper to generate pass code for gate passes
export function generatePassCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GP-${random}-${timestamp}`;
}

// Helper to generate student QR code
export function generateStudentQRCode(studentId: string, orgId: string): string {
  return QRGenerator.generateStudentQR(studentId, orgId);
}

// Helper to generate gate pass QR code
export function generateGatePassQRCode(
  passId: string,
  studentId: string,
  hostelId: string,
  validFrom: Date,
  validTo: Date
): string {
  return QRGenerator.generateGatePassQR(passId, studentId, hostelId, validFrom, validTo);
}

// Helper to validate gate pass QR code
export function validateGatePassQR(encoded: string) {
  return QRGenerator.validateGatePassQR(encoded);
}