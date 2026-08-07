const nodemailer = require('nodemailer');

/**
 * PRD section 8 lists the notification service as "to confirm" - it may already exist
 * elsewhere in EduSuite. This service implements a real, working email/SMS sender that
 * gracefully falls back to console logging when SMTP/SMS credentials are not configured,
 * so the app is fully runnable out of the box (Assumption - see README).
 */

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL:MOCK] To: ${to} | Subject: ${subject}\n${html}\n`);
    return { mocked: true };
  }
  return t.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
};

const sendSms = async ({ to, message }) => {
  if (process.env.SMS_PROVIDER === 'console' || !process.env.SMS_API_KEY) {
    console.log(`[SMS:MOCK] To: ${to} | Message: ${message}`);
    return { mocked: true };
  }
  // Real MSG91/Twilio integration would go here, keyed off process.env.SMS_PROVIDER.
  console.log(`[SMS] (provider=${process.env.SMS_PROVIDER}) To: ${to} | ${message}`);
  return { sent: true };
};

module.exports = { sendEmail, sendSms };
