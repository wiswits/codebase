import { body, param, query } from 'express-validator';

export const listCapacityValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('employee_id').optional().isUUID().withMessage('employee_id must be a valid UUID.'),
  query('period_start').optional().isISO8601(),
  query('period_end').optional().isISO8601(),
];

export const getCapacityValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const createCapacityValidator = [
  body('employee_id').isUUID().withMessage('employee_id must be a valid UUID.'),
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
  body('available_hours')
    .isFloat({ min: 0, max: 744 })
    .withMessage('available_hours must be a non-negative number.'),
];

export const updateCapacityValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
  body('available_hours').optional().isFloat({ min: 0, max: 744 }),
  body('allocated_hours').optional().isFloat({ min: 0, max: 744 }),
];

export const deleteCapacityValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];
