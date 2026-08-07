import Joi from 'joi';
import {
  VACANCY_STATUS,
  EMPLOYMENT_TYPE,
  WORK_MODE,
  VALIDATION,
} from '../../../config/constants.js';

/**
 * Vacancy Validation Schemas
 */
export const vacancyValidation = {
  /**
   * Create vacancy validation schema
   */
  create: Joi.object({
    vacancy_code: Joi.string()
      .max(VALIDATION.MAX_VACANCY_CODE_LENGTH)
      .required()
      .messages({
        'string.empty': 'Vacancy code is required',
        'string.max': `Vacancy code must be at most ${VALIDATION.MAX_VACANCY_CODE_LENGTH} characters`,
      }),

    job_title: Joi.string()
      .max(VALIDATION.MAX_JOB_TITLE_LENGTH)
      .required()
      .messages({
        'string.empty': 'Job title is required',
        'string.max': `Job title must be at most ${VALIDATION.MAX_JOB_TITLE_LENGTH} characters`,
      }),

    department: Joi.string()
      .max(VALIDATION.MAX_DEPARTMENT_LENGTH)
      .required()
      .messages({
        'string.empty': 'Department is required',
        'string.max': `Department must be at most ${VALIDATION.MAX_DEPARTMENT_LENGTH} characters`,
      }),

    designation: Joi.string()
      .max(VALIDATION.MAX_DEPARTMENT_LENGTH)
      .allow(null, ''),

    employment_type: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE))
      .default(EMPLOYMENT_TYPE.FULL_TIME),

    work_mode: Joi.string()
      .valid(...Object.values(WORK_MODE))
      .default(WORK_MODE.ON_SITE),

    location: Joi.string()
      .max(150)
      .allow(null, ''),

    number_of_openings: Joi.number()
      .integer()
      .min(1)
      .default(1),

    experience_required: Joi.string()
      .max(100)
      .allow(null, ''),

    salary_min: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    salary_max: Joi.number()
      .precision(2)
      .min(0)
      .allow(null)
      .when('salary_min', {
        is: Joi.number().min(0),
        then: Joi.number().greater(Joi.ref('salary_min'))
          .messages({
            'number.greater': 'Salary max must be greater than salary min',
          }),
      }),

    currency: Joi.string()
      .max(10)
      .default('INR'),

    job_description: Joi.string()
      .allow(null, ''),

    required_skills: Joi.string()
      .allow(null, ''),

    preferred_skills: Joi.string()
      .allow(null, ''),

    education_required: Joi.string()
      .max(150)
      .allow(null, ''),

    application_start_date: Joi.date()
      .iso()
      .allow(null),

    application_end_date: Joi.date()
      .iso()
      .allow(null)
      .when('application_start_date', {
        is: Joi.date().iso(),
        then: Joi.date().greater(Joi.ref('application_start_date'))
          .messages({
            'date.greater': 'Application end date must be after start date',
          }),
      }),

    expected_joining_date: Joi.date()
      .iso()
      .allow(null),

    hiring_manager_id: Joi.number()
      .integer()
      .allow(null),

    recruiter_id: Joi.number()
      .integer()
      .allow(null),

    status: Joi.string()
      .valid(...Object.values(VACANCY_STATUS))
      .default(VACANCY_STATUS.DRAFT),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Update vacancy validation schema
   * All fields optional for partial updates
   */
  update: Joi.object({
    vacancy_code: Joi.string()
      .max(VALIDATION.MAX_VACANCY_CODE_LENGTH),

    job_title: Joi.string()
      .max(VALIDATION.MAX_JOB_TITLE_LENGTH),

    department: Joi.string()
      .max(VALIDATION.MAX_DEPARTMENT_LENGTH),

    designation: Joi.string()
      .max(VALIDATION.MAX_DEPARTMENT_LENGTH)
      .allow(null, ''),

    employment_type: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE)),

    work_mode: Joi.string()
      .valid(...Object.values(WORK_MODE)),

    location: Joi.string()
      .max(150)
      .allow(null, ''),

    number_of_openings: Joi.number()
      .integer()
      .min(1),

    experience_required: Joi.string()
      .max(100)
      .allow(null, ''),

    salary_min: Joi.number()
      .precision(2)
      .min(0)
      .allow(null),

    salary_max: Joi.number()
      .precision(2)
      .min(0)
      .allow(null)
      .when('salary_min', {
        is: Joi.number().min(0),
        then: Joi.number().greater(Joi.ref('salary_min'))
          .messages({
            'number.greater': 'Salary max must be greater than salary min',
          }),
      }),

    currency: Joi.string()
      .max(10),

    job_description: Joi.string()
      .allow(null, ''),

    required_skills: Joi.string()
      .allow(null, ''),

    preferred_skills: Joi.string()
      .allow(null, ''),

    education_required: Joi.string()
      .max(150)
      .allow(null, ''),

    application_start_date: Joi.date()
      .iso()
      .allow(null),

    application_end_date: Joi.date()
      .iso()
      .allow(null)
      .when('application_start_date', {
        is: Joi.date().iso(),
        then: Joi.date().greater(Joi.ref('application_start_date'))
          .messages({
            'date.greater': 'Application end date must be after start date',
          }),
      }),

    expected_joining_date: Joi.date()
      .iso()
      .allow(null),

    hiring_manager_id: Joi.number()
      .integer()
      .allow(null),

    recruiter_id: Joi.number()
      .integer()
      .allow(null),

    status: Joi.string()
      .valid(...Object.values(VACANCY_STATUS)),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Vacancy ID param validation
   */
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Vacancy ID must be a number',
        'number.positive': 'Vacancy ID must be a positive number',
        'any.required': 'Vacancy ID is required',
      }),
  }),

  /**
   * Query filters validation
   */
  queryFilters: Joi.object({
    search: Joi.string()
      .allow('')
      .optional(),

    status: Joi.string()
      .valid(...Object.values(VACANCY_STATUS))
      .optional(),

    department: Joi.string()
      .max(VALIDATION.MAX_DEPARTMENT_LENGTH)
      .optional(),

    employment_type: Joi.string()
      .valid(...Object.values(EMPLOYMENT_TYPE))
      .optional(),

    work_mode: Joi.string()
      .valid(...Object.values(WORK_MODE))
      .optional(),

    from_date: Joi.date()
      .iso()
      .optional(),

    to_date: Joi.date()
      .iso()
      .optional(),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(50),

    offset: Joi.number()
      .integer()
      .min(0)
      .default(0),

    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'job_title', 'status', 'application_start_date')
      .default('created_at'),

    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC'),
  }),
};

export default vacancyValidation;