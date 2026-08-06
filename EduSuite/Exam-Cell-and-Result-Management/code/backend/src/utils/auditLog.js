import AuditLog from '../models/AuditLog.js';

export const logAction = async ({ userId, action, module, details, req }) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      module,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || undefined,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};
