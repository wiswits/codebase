import { query } from 'express-validator';

const requiredDateRange = [
  query('period_start')
    .isISO8601()
    .withMessage('period_start is required and must be a valid ISO-8601 date.'),
  query('period_end')
    .isISO8601()
    .withMessage('period_end is required and must be a valid ISO-8601 date.')
    .custom((value, { req }) => {
      if (new Date(value as string) < new Date(req.query?.period_start as string)) {
        throw new Error('period_end must be on or after period_start.');
      }
      return true;
    }),
  query('department').optional().isString().trim().isLength({ max: 100 }),
];

export const utilizationTrendValidator = [...requiredDateRange];
export const benchTrendValidator = [...requiredDateRange];
export const allocationDistributionValidator = [...requiredDateRange];
export const capacityForecastValidator = [...requiredDateRange];
