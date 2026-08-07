import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
};

// Sends an email if SMTP credentials are configured; otherwise logs to the
// console so local development never crashes on a missing mail server.
export const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[email skipped - no SMTP configured] To: ${to} | Subject: ${subject}`);
    return { sent: false, reason: 'SMTP not configured' };
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
};
