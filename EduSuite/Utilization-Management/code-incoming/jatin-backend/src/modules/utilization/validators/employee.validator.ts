import { body, param, query } from 'express-validator';

const EMPLOYEE_STATUSES = ['active', 'inactive', 'on_leave', 'terminated'];

export const listEmployeesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('status')
    .optional()
    .isIn(EMPLOYEE_STATUSES)
    .withMessage(`status must be one of: ${EMPLOYEE_STATUSES.join(', ')}.`),
  query('department').optional().isString().trim().isLength({ max: 100 }),
  query('search').optional().isString().trim().isLength({ max: 150 }),
];

export const getEmployeeValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];

export const createEmployeeValidator = [
  body('employee_code')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('employee_code is required.')
    .isLength({ max: 50 })
    .withMessage('employee_code must not exceed 50 characters.'),
  body('full_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('full_name is required.')
    .isLength({ max: 150 })
    .withMessage('full_name must not exceed 150 characters.'),
  body('email').isEmail().withMessage('email must be a valid email address.').normalizeEmail(),
  body('designation')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('designation is required.')
    .isLength({ max: 100 }),
  body('department')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('department is required.')
    .isLength({ max: 100 }),
  body('skills').optional().isArray().withMessage('skills must be an array of strings.'),
  body('skills.*').optional().isString().isLength({ max: 60 }),
  body('weekly_capacity_hours')
    .isFloat({ min: 0, max: 168 })
    .withMessage('weekly_capacity_hours must be a number between 0 and 168.'),
];

export const updateEmployeeValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
  body('full_name').optional().isString().trim().isLength({ max: 150 }),
  body('designation').optional().isString().trim().isLength({ max: 100 }),
  body('department').optional().isString().trim().isLength({ max: 100 }),
  body('skills').optional().isArray().withMessage('skills must be an array of strings.'),
  body('skills.*').optional().isString().isLength({ max: 60 }),
  body('status')
    .optional()
    .isIn(EMPLOYEE_STATUSES)
    .withMessage(`status must be one of: ${EMPLOYEE_STATUSES.join(', ')}.`),
  body('weekly_capacity_hours').optional().isFloat({ min: 0, max: 168 }),
];

export const deleteEmployeeValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID.'),
];
