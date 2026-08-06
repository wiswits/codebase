import { query } from 'express-validator';

/**
 * Dashboard is read-only (aggregate) data, scoped by an optional date
 * range. No mutation validators are required for this resource.
 */
export const getDashboardSummaryValidator = [
  query('period_start')
    .optional()
    .isISO8601()
    .withMessage('period_start must be a valid ISO-8601 date.'),
  query('period_end')
    .optional()
    .isISO8601()
    .withMessage('period_end must be a valid ISO-8601 date.')
    .custom((value, { req }) => {
      const start = req.query?.period_start;
      if (start && value && new Date(value as string) < new Date(start as string)) {
        throw new Error('period_end must be on or after period_start.');
      }
      return true;
    }),
];
