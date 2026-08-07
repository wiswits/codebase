import { body } from 'express-validator';

export const updateSettingsValidator = [
  body('default_capacity_hours').optional().isFloat({ min: 0, max: 168 }),
  body('utilization_target_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('bench_alert_threshold_days').optional().isInt({ min: 0, max: 365 }),
];
