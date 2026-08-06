const { createHash } = require('crypto');
const QRCode = require('qrcode');
const { logger } = require('../utils/logger');
const { getConnection } = require('../config/database');

class VerificationService {
  static async generateVerificationCode(documentId) {
    const db = await getConnection();
    const code = this.generateCode();
    const hash = this.generateHash(documentId);

    const [result] = await db.query(
      `INSERT INTO document_verifications 
       (document_id, verification_code, hash_value, status)
       VALUES (?, ?, ?, 'pending')`,
      [documentId, code, hash]
    );

    // Generate QR code
    const qrData = {
      verificationCode: code,
      documentId,
      hash
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    await db.query(
      'UPDATE document_verifications SET qr_code_url = ? WHERE id = ?',
      [qrCode, result.insertId]
    );

    return {
      id: result.insertId,
      verificationCode: code,
      qrCode,
      hash
    };
  }

  static async verifyDocument(verificationCode, documentNumber) {
    const db = await getConnection();
    
    const [rows] = await db.query(
      `SELECT v.*, d.document_number, d.title, d.status, d.metadata,
       o.name as organization_name
       FROM document_verifications v
       JOIN documents d ON v.document_id = d.id
       JOIN organizations o ON d.org_id = o.id
       WHERE v.verification_code = ? AND d.document_number = ?
       AND v.status != 'expired'`,
      [verificationCode, documentNumber]
    );

    if (rows.length === 0) {
      return { verified: false, message: 'Invalid verification code or document number' };
    }

    const verification = rows[0];

    if (verification.status === 'verified') {
      return {
        verified: true,
        previouslyVerified: true,
        document: {
          documentNumber: verification.document_number,
          title: verification.title,
          status: verification.status,
          organization: verification.organization_name,
          issuedAt: verification.created_at
        }
      };
    }

    // Update verification status
    await db.query(
      `UPDATE document_verifications 
       SET status = 'verified', last_verified_at = CURRENT_TIMESTAMP, 
           verification_count = verification_count + 1
       WHERE id = ?`,
      [verification.id]
    );

    return {
      verified: true,
      previouslyVerified: false,
      document: {
        documentNumber: verification.document_number,
        title: verification.title,
        status: verification.status,
        organization: verification.organization_name,
        issuedAt: verification.created_at
      }
    };
  }

  static async verifyByHash(hash) {
    const db = await getConnection();
    
    const [rows] = await db.query(
      `SELECT v.*, d.document_number, d.title, d.status
       FROM document_verifications v
       JOIN documents d ON v.document_id = d.id
       WHERE v.hash_value = ? AND v.status = 'pending'`,
      [hash]
    );

    if (rows.length === 0) {
      return { verified: false, message: 'Invalid or already verified document' };
    }

    const verification = rows[0];
    await db.query(
      'UPDATE document_verifications SET status = "verified", last_verified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [verification.id]
    );

    return {
      verified: true,
      document: {
        documentNumber: verification.document_number,
        title: verification.title,
        status: verification.status
      }
    };
  }

  static async getVerificationHistory(documentId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT * FROM document_verifications 
       WHERE document_id = ?
       ORDER BY created_at DESC`,
      [documentId]
    );
    return rows;
  }

  static async getVerificationStats(orgId) {
    const db = await getConnection();
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM document_verifications v
       JOIN documents d ON v.document_id = d.id
       WHERE d.org_id = ?`,
      [orgId]
    );
    return rows[0] || { total: 0, verified: 0, pending: 0, failed: 0, expired: 0, today: 0 };
  }

  static generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static generateHash(documentId) {
    return createHash('sha256')
      .update(`${documentId}-${Date.now()}-${Math.random()}`)
      .digest('hex');
  }
}

module.exports = VerificationService;