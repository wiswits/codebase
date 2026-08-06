import { body, param, query } from 'express-validator';

export const listBenchValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('employee_id').optional().isUUID().withMessage('employee_id must be a valid UUID.'),
  query('active_only').optional().isBoolean().toBoolean(),
];

export const getBenchValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const assignBenchValidator = [
  body('employee_id').isUUID().withMessage('employee_id must be a valid UUID.'),
  body('bench_start_date').isISO8601().withMessage('bench_start_date must be a valid ISO-8601 date.'),
  body('reason')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('reason is required.')
    .isLength({ max: 500 })
    .withMessage('reason must not exceed 500 characters.'),
];

export const unassignBenchValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
  body('bench_end_date')
    .isISO8601()
    .withMessage('bench_end_date must be a valid ISO-8601 date.'),
];
