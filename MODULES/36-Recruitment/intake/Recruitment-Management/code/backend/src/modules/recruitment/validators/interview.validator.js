import Joi from 'joi';
import {
  INTERVIEW_TYPE,
  INTERVIEW_MODE,
  INTERVIEW_STATUS,
  RECOMMENDATION,
} from '../../../config/constants.js';

/**
 * Interview Validation Schemas
 */
export const interviewValidation = {
  /**
   * Create interview validation schema
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

    interview_round: Joi.number()
      .integer()
      .min(1)
      .default(1),

    interview_type: Joi.string()
      .valid(...Object.values(INTERVIEW_TYPE))
      .required()
      .messages({
        'string.empty': 'Interview type is required',
        'any.only': 'Invalid interview type',
      }),

    interview_mode: Joi.string()
      .valid(...Object.values(INTERVIEW_MODE))
      .required()
      .messages({
        'string.empty': 'Interview mode is required',
        'any.only': 'Invalid interview mode',
      }),

    interview_date: Joi.date()
      .iso()
      .required()
      .messages({
        'date.base': 'Valid interview date is required',
        'date.iso': 'Invalid date format',
      }),

    start_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.empty': 'Start time is required',
        'string.pattern.base': 'Invalid time format (HH:MM)',
      }),

    end_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow(null, '')
      .when('start_time', {
        is: Joi.string().required(),
        then: Joi.string().custom((value, helpers) => {
          if (value && value <= helpers.state.ancestors[0].start_time) {
            return helpers.error('any.custom', {
              message: 'End time must be after start time',
            });
          }
          return value;
        }),
      }),

    venue: Joi.string()
      .max(255)
      .allow(null, ''),

    meeting_link: Joi.string()
      .uri()
      .max(500)
      .allow(null, ''),

    interviewer_name: Joi.string()
      .max(150)
      .required()
      .messages({
        'string.empty': 'Interviewer name is required',
      }),

    interviewer_email: Joi.string()
      .email()
      .max(150)
      .allow(null, ''),

    interviewer_designation: Joi.string()
      .max(150)
      .allow(null, ''),

    status: Joi.string()
      .valid(...Object.values(INTERVIEW_STATUS))
      .default(INTERVIEW_STATUS.SCHEDULED),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Update interview validation schema
   */
  update: Joi.object({
    applicant_id: Joi.number()
      .integer()
      .positive(),

    vacancy_id: Joi.number()
      .integer()
      .positive(),

    interview_round: Joi.number()
      .integer()
      .min(1),

    interview_type: Joi.string()
      .valid(...Object.values(INTERVIEW_TYPE)),

    interview_mode: Joi.string()
      .valid(...Object.values(INTERVIEW_MODE)),

    interview_date: Joi.date()
      .iso(),

    start_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow(null, ''),

    end_time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow(null, ''),

    venue: Joi.string()
      .max(255)
      .allow(null, ''),

    meeting_link: Joi.string()
      .uri()
      .max(500)
      .allow(null, ''),

    interviewer_name: Joi.string()
      .max(150),

    interviewer_email: Joi.string()
      .email()
      .max(150)
      .allow(null, ''),

    interviewer_designation: Joi.string()
      .max(150)
      .allow(null, ''),

    rating: Joi.number()
      .precision(2)
      .min(0)
      .max(5)
      .allow(null),

    feedback: Joi.string()
      .allow(null, ''),

    recommendation: Joi.string()
      .valid(...Object.values(RECOMMENDATION))
      .allow(null),

    status: Joi.string()
      .valid(...Object.values(INTERVIEW_STATUS)),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Interview ID param validation
   */
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Interview ID must be a number',
        'number.positive': 'Interview ID must be a positive number',
        'any.required': 'Interview ID is required',
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
      .valid(...Object.values(INTERVIEW_STATUS))
      .optional(),

    interview_type: Joi.string()
      .valid(...Object.values(INTERVIEW_TYPE))
      .optional(),

    interview_mode: Joi.string()
      .valid(...Object.values(INTERVIEW_MODE))
      .optional(),

    interviewer_name: Joi.string()
      .max(150)
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
      .max(200)
      .default(50),

    offset: Joi.number()
      .integer()
      .min(0)
      .default(0),

    sort_by: Joi.string()
      .valid('interview_date', 'start_time', 'created_at', 'status', 'interview_type')
      .default('interview_date'),

    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC'),
  }),
};

export default interviewValidation;