import Joi from 'joi';
import {
  OFFER_STATUS,
  EMPLOYMENT_TYPE,
  WORK_MODE,
} from '../../../config/constants.js';

/**
 * Offer Validation Schemas
 */
export const offerValidation = {
  /**
   * Create offer validation schema
   */
  create: Joi.object({
    applicant_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Applicant ID is required',
        'number.positive': 'Applicant ID must be a positive number',
      }),

    vacancy_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Vacancy ID is required',
        'number.positive': 'Vacancy ID must be a positive number',
      }),

    offer_reference: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.empty': 'Offer reference is required',
        'string.max': 'Offer reference must be at most 50 characters',
      }),

    offer_date: Joi.date()
      .iso()
      .required()
      .messages({
        'date.base': 'Valid offer date is required',
        'date.iso': 'Invalid date format',
      }),

    joining_date: Joi.date()
      .iso()
      .allow(null)
      .when('offer_date', {
        is: Joi.date().iso(),
        then: Joi.date().greater(Joi.ref('offer_date'))
          .messages({
            'date.greater': 'Joining date must be after offer date',
          }),
      }),

    designation: Joi.string()
      .max(150)
      .required()
      .messages({
        'string.empty': 'Designation is required',
        'string.max': 'Designation must be at most 150 characters',
      }),

    department: Joi.string()
      .max(100)
      .allow(null, ''),

    employment_type: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE))
      .required()
      .messages({
        'string.empty': 'Employment type is required',
        'any.only': 'Invalid employment type',
      }),

    work_mode: Joi.string()
      .valid(...Object.values(WORK_MODE))
      .required()
      .messages({
        'string.empty': 'Work mode is required',
        'any.only': 'Invalid work mode',
      }),

    work_location: Joi.string()
      .max(150)
      .allow(null, ''),

    salary: Joi.number()
      .precision(2)
      .min(0)
      .required()
      .messages({
        'number.base': 'Valid salary is required',
        'number.min': 'Salary must be greater than 0',
      }),

    bonus: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    probation_months: Joi.number()
      .integer()
      .min(0)
      .max(24)
      .allow(null),

    reporting_manager: Joi.string()
      .max(150)
      .allow(null, ''),

    offer_document: Joi.string()
      .max(255)
      .allow(null, ''),

    status: Joi.string()
      .valid(...Object.values(OFFER_STATUS))
      .default(OFFER_STATUS.DRAFT),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Update offer validation schema
   */
  update: Joi.object({
    applicant_id: Joi.number()
      .integer()
      .positive(),

    vacancy_id: Joi.number()
      .integer()
      .positive(),

    offer_reference: Joi.string()
      .max(50),

    offer_date: Joi.date()
      .iso(),

    joining_date: Joi.date()
      .iso()
      .allow(null),

    designation: Joi.string()
      .max(150),

    department: Joi.string()
      .max(100)
      .allow(null, ''),

    employment_type: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE)),

    work_mode: Joi.string()
      .valid(...Object.values(WORK_MODE)),

    work_location: Joi.string()
      .max(150)
      .allow(null, ''),

    salary: Joi.number()
      .precision(2)
      .min(0),

    bonus: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    probation_months: Joi.number()
      .integer()
      .min(0)
      .max(24)
      .allow(null),

    reporting_manager: Joi.string()
      .max(150)
      .allow(null, ''),

    offer_document: Joi.string()
      .max(255)
      .allow(null, ''),

    status: Joi.string()
      .valid(...Object.values(OFFER_STATUS)),

    accepted_on: Joi.date()
      .iso()
      .allow(null),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Offer ID param validation
   */
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Offer ID must be a number',
        'number.positive': 'Offer ID must be a positive number',
        'any.required': 'Offer ID is required',
      }),
  }),

  /**
   * Query filters validation
   */
  queryFilters: Joi.object({
    applicant_id: Joi.number()
      .integer()
      .positive()
      .optional(),

    vacancy_id: Joi.number()
      .integer()
      .positive()
      .optional(),

    status: Joi.string()
      .valid(...Object.values(OFFER_STATUS))
      .optional(),

    from_date: Joi.date()
      .iso()
      .optional(),

    to_date: Joi.date()
      .iso()
      .optional(),

    search: Joi.string()
      .max(100)
      .optional(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(200)
      .default(50),

    offset: Joi.number()
      .integer()
      .min(0)
      .default(0),

    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'offer_date', 'joining_date', 'status')
      .default('created_at'),

    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC'),
  }),
};

export default offerValidation;