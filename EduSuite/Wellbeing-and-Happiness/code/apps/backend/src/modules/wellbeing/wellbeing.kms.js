// wellbeing.kms.js
//
// KMS stand-in. In production this MUST be a real KMS (AWS KMS, GCP KMS, Vault).
// Here it wraps/unwraps per-student data-encryption-keys (DEKs) using a single
// master key held only in the environment (WB_MASTER_KEY).
//
// The contract the rest of the module relies on:
//   wrap(dek)      -> opaque bytes that only unwrap() can reverse
//   unwrap(bytes)  -> the original dek
// The plaintext master key never leaves this file.

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

// Derive a stable 32-byte master key from the env secret. Accepts base64, hex,
// or raw text — whatever the operator provides — and normalises via SHA-256 so
// the wrapping key is always exactly 32 bytes.
function masterKey() {
  const raw = process.env.WB_MASTER_KEY;
  if (!raw || raw === 'change-me-32-byte-base64-master-key') {
    throw new Error('WB_MASTER_KEY is not set (or is the default). Refusing to wrap keys.');
  }
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

// Wrap a DEK. Output layout: [12-byte iv][16-byte tag][ciphertext].
function wrap(dek) {
  const mk = masterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, mk, iv);
  const ct = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  mk.fill(0);
  return Buffer.concat([iv, tag, ct]);
}

function unwrap(wrapped) {
  const buf = Buffer.isBuffer(wrapped) ? wrapped : Buffer.from(wrapped);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const mk = masterKey();
  const decipher = crypto.createDecipheriv(ALGO, mk, iv);
  decipher.setAuthTag(tag);
  const dek = Buffer.concat([decipher.update(ct), decipher.final()]);
  mk.fill(0);
  return dek;
}

module.exports = { wrap, unwrap };
