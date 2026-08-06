import Joi from 'joi';
import {
  APPLICANT_STAGES,
  APPLICANT_STATUS,
  APPLICATION_SOURCE,
  GENDER,
  VALIDATION,
} from '../../../config/constants.js';

/**
 * Applicant Validation Schemas
 */
export const applicantValidation = {
  /**
   * Create applicant validation schema
   */
  create: Joi.object({
    vacancy_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Vacancy ID is required and must be a number',
        'number.positive': 'Vacancy ID must be a positive number',
      }),

    first_name: Joi.string()
      .max(VALIDATION.MAX_NAME_LENGTH)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': `First name must be at most ${VALIDATION.MAX_NAME_LENGTH} characters`,
      }),

    last_name: Joi.string()
      .max(VALIDATION.MAX_NAME_LENGTH)
      .allow(null, ''),

    full_name: Joi.string()
      .max(200)
      .required()
      .messages({
        'string.empty': 'Full name is required',
      }),

    email: Joi.string()
      .email()
      .max(VALIDATION.MAX_EMAIL_LENGTH)
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'string.max': `Email must be at most ${VALIDATION.MAX_EMAIL_LENGTH} characters`,
      }),

    phone: Joi.string()
      .max(VALIDATION.MAX_PHONE_LENGTH)
      .required()
      .messages({
        'string.empty': 'Phone number is required',
        'string.max': `Phone must be at most ${VALIDATION.MAX_PHONE_LENGTH} characters`,
      }),

    alternate_phone: Joi.string()
      .max(VALIDATION.MAX_PHONE_LENGTH)
      .allow(null, ''),

    gender: Joi.string()
      .valid(...Object.values(GENDER))
      .allow(null),

    date_of_birth: Joi.date()
      .iso()
      .allow(null),

    current_city: Joi.string()
      .max(100)
      .allow(null, ''),

    current_state: Joi.string()
      .max(100)
      .allow(null, ''),

    current_country: Joi.string()
      .max(100)
      .allow(null, ''),

    address: Joi.string()
      .allow(null, ''),

    highest_qualification: Joi.string()
      .max(150)
      .allow(null, ''),

    specialization: Joi.string()
      .max(150)
      .allow(null, ''),

    university: Joi.string()
      .max(200)
      .allow(null, ''),

    graduation_year: Joi.number()
      .integer()
      .min(1950)
      .max(new Date().getFullYear() + 1)
      .allow(null),

    total_experience: Joi.number()
      .precision(1)
      .min(0)
      .max(60)
      .default(0),

    current_company: Joi.string()
      .max(200)
      .allow(null, ''),

    current_designation: Joi.string()
      .max(150)
      .allow(null, ''),

    current_ctc: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    expected_ctc: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    notice_period: Joi.number()
      .integer()
      .min(0)
      .max(365)
      .allow(null),

    resume_file: Joi.string()
      .max(255)
      .allow(null, ''),

    portfolio_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    linkedin_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    github_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    current_stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
      .default(APPLICANT_STAGES.APPLIED),

    application_source: Joi.string()
      .valid(...Object.values(APPLICATION_SOURCE))
      .default(APPLICATION_SOURCE.WEBSITE),

    application_date: Joi.date()
      .iso()
      .default(() => new Date().toISOString().split('T')[0]),

    status: Joi.string()
      .valid(...Object.values(APPLICANT_STATUS))
      .default(APPLICANT_STATUS.ACTIVE),

    recruiter_id: Joi.number()
      .integer()
      .allow(null),

    notes: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Bulk import validation schema
   */
  bulkImport: Joi.object({
    applicants: Joi.array()
      .items(Joi.object({
        vacancy_id: Joi.number().integer().positive().required(),
        first_name: Joi.string().max(VALIDATION.MAX_NAME_LENGTH).required(),
        last_name: Joi.string().max(VALIDATION.MAX_NAME_LENGTH).allow(null, ''),
        email: Joi.string().email().max(VALIDATION.MAX_EMAIL_LENGTH).required(),
        phone: Joi.string().max(VALIDATION.MAX_PHONE_LENGTH).required(),
        current_stage: Joi.string().valid(...Object.values(APPLICANT_STAGES)).default(APPLICANT_STAGES.APPLIED),
        total_experience: Joi.number().precision(1).min(0).max(60).default(0),
        // Other fields are optional
      }))
      .min(1)
      .max(1000)
      .required()
      .messages({
        'array.min': 'At least one applicant is required',
        'array.max': 'Cannot import more than 1000 applicants at once',
      }),
  }),

  /**
   * Update applicant validation schema
   */
  update: Joi.object({
    vacancy_id: Joi.number()
      .integer()
      .positive(),

    first_name: Joi.string()
      .max(VALIDATION.MAX_NAME_LENGTH),

    last_name: Joi.string()
      .max(VALIDATION.MAX_NAME_LENGTH)
      .allow(null, ''),

    full_name: Joi.string()
      .max(200),

    email: Joi.string()
      .email()
      .max(VALIDATION.MAX_EMAIL_LENGTH),

    phone: Joi.string()
      .max(VALIDATION.MAX_PHONE_LENGTH),

    alternate_phone: Joi.string()
      .max(VALIDATION.MAX_PHONE_LENGTH)
      .allow(null, ''),

    gender: Joi.string()
      .valid(...Object.values(GENDER))
      .allow(null),

    date_of_birth: Joi.date()
      .iso()
      .allow(null),

    current_city: Joi.string()
      .max(100)
      .allow(null, ''),

    current_state: Joi.string()
      .max(100)
      .allow(null, ''),

    current_country: Joi.string()
      .max(100)
      .allow(null, ''),

    address: Joi.string()
      .allow(null, ''),

    highest_qualification: Joi.string()
      .max(150)
      .allow(null, ''),

    specialization: Joi.string()
      .max(150)
      .allow(null, ''),

    university: Joi.string()
      .max(200)
      .allow(null, ''),

    graduation_year: Joi.number()
      .integer()
      .min(1950)
      .max(new Date().getFullYear() + 1)
      .allow(null),

    total_experience: Joi.number()
      .precision(1)
      .min(0)
      .max(60),

    current_company: Joi.string()
      .max(200)
      .allow(null, ''),

    current_designation: Joi.string()
      .max(150)
      .allow(null, ''),

    current_ctc: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    expected_ctc: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    notice_period: Joi.number()
      .integer()
      .min(0)
      .max(365)
      .allow(null),

    resume_file: Joi.string()
      .max(255)
      .allow(null, ''),

    portfolio_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    linkedin_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    github_url: Joi.string()
      .uri()
      .max(255)
      .allow(null, ''),

    current_stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES)),

    application_source: Joi.string()
      .valid(...Object.values(APPLICATION_SOURCE)),

    application_date: Joi.date()
      .iso(),

    status: Joi.string()
      .valid(...Object.values(APPLICANT_STATUS)),

    recruiter_id: Joi.number()
      .integer()
      .allow(null),

    notes: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Change stage validation
   */
  changeStage: Joi.object({
    stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
      .required()
      .messages({
        'string.empty': 'Stage is required',
        'any.only': 'Invalid stage value',
      }),
    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Applicant ID param validation
   */
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Applicant ID must be a number',
        'number.positive': 'Applicant ID must be a positive number',
        'any.required': 'Applicant ID is required',
      }),
  }),

  /**
   * Advanced query filters validation
   */
  queryFilters: Joi.object({
    search: Joi.string()
      .allow('')
      .optional(),

    vacancy_id: Joi.number()
      .integer()
      .positive()
      .optional(),

    current_stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
      .optional(),

    status: Joi.string()
      .valid(...Object.values(APPLICANT_STATUS))
      .optional(),

    application_source: Joi.string()
      .valid(...Object.values(APPLICATION_SOURCE))
      .optional(),

    gender: Joi.string()
      .valid(...Object.values(GENDER))
      .optional(),

    min_experience: Joi.number()
      .precision(1)
      .min(0)
      .optional(),

    max_experience: Joi.number()
      .precision(1)
      .min(0)
      .optional(),

    min_ctc: Joi.number()
      .precision(2)
      .min(0)
      .optional(),

    max_ctc: Joi.number()
      .precision(2)
      .min(0)
      .optional(),

    city: Joi.string()
      .max(100)
      .optional(),

    state: Joi.string()
      .max(100)
      .optional(),

    country: Joi.string()
      .max(100)
      .optional(),

    highest_qualification: Joi.string()
      .max(150)
      .optional(),

    from_date: Joi.date()
      .iso()
      .optional(),

    to_date: Joi.date()
      .iso()
      .optional(),

    recruiter_id: Joi.number()
      .integer()
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
      .valid('created_at', 'updated_at', 'full_name', 'email', 'current_stage', 'application_date', 'total_experience')
      .default('created_at'),

    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC'),
  }),
};

export default applicantValidation;