import { body, param, query } from 'express-validator';

const REPORT_TYPES = [
  'utilization_summary',
  'bench_summary',
  'allocation_summary',
  'capacity_summary',
];

export const listReportsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('report_type')
    .optional()
    .isIn(REPORT_TYPES)
    .withMessage(`report_type must be one of: ${REPORT_TYPES.join(', ')}.`),
];

export const getReportValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const generateReportValidator = [
  body('report_type')
    .isIn(REPORT_TYPES)
    .withMessage(`report_type must be one of: ${REPORT_TYPES.join(', ')}.`),
  body('period_start').isISO8601().withMessage('period_start must be a valid ISO-8601 date.'),
  body('period_end')
    .isISO8601()
    .withMessage('period_end must be a valid ISO-8601 date.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.period_start)) {
        throw new Error('period_end must be after period_start.');
      }
      return true;
    }),
];

export const downloadReportValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const deleteReportValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];
