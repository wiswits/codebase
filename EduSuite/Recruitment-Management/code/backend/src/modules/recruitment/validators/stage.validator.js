import Joi from 'joi';
import { APPLICANT_STAGES } from '../../../config/constants.js';

/**
 * Stage Validation Schemas
 */
export const stageValidation = {
  /**
   * Create stage validation
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

    from_stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
      .allow(null),

    to_stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
      .required()
      .messages({
        'string.empty': 'Target stage is required',
        'any.only': 'Invalid stage value',
      }),

    remarks: Joi.string()
      .allow(null, ''),
  }),

  /**
   * Query filters for stages
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

    from_date: Joi.date()
      .iso()
      .optional(),

    to_date: Joi.date()
      .iso()
      .optional(),

    stage: Joi.string()
      .valid(...Object.values(APPLICANT_STAGES))
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
  }),
};

export default stageValidation;