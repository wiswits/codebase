import { body, param, query } from 'express-validator';

const ALLOCATION_STATUSES = ['draft', 'active', 'completed', 'cancelled'];

export const listAllocationsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('employee_id').optional().isUUID().withMessage('employee_id must be a valid UUID.'),
  query('project_id').optional().isUUID().withMessage('project_id must be a valid UUID.'),
  query('status')
    .optional()
    .isIn(ALLOCATION_STATUSES)
    .withMessage(`status must be one of: ${ALLOCATION_STATUSES.join(', ')}.`),
];

export const getAllocationValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const createAllocationValidator = [
  body('employee_id').isUUID().withMessage('employee_id must be a valid UUID.'),
  body('project_id').isUUID().withMessage('project_id must be a valid UUID.'),
  body('allocation_percentage')
    .isFloat({ min: 1, max: 100 })
    .withMessage('allocation_percentage must be between 1 and 100.'),
  body('start_date').isISO8601().withMessage('start_date must be a valid ISO-8601 date.'),
  body('end_date')
    .isISO8601()
    .withMessage('end_date must be a valid ISO-8601 date.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('end_date must be after start_date.');
      }
      return true;
    }),
];

export const updateAllocationValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
  body('allocation_percentage').optional().isFloat({ min: 1, max: 100 }),
  body('start_date').optional().isISO8601(),
  body('end_date')
    .optional()
    .isISO8601()
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('end_date must be after start_date.');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(ALLOCATION_STATUSES)
    .withMessage(`status must be one of: ${ALLOCATION_STATUSES.join(', ')}.`),
];

export const deleteAllocationValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];
