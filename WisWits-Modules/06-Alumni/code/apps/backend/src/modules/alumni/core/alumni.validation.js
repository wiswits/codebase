'use strict';
const Joi = require('joi');

const alumniIdParams = Joi.object({
  alumniId: Joi.number().integer().positive().required().messages({
    'number.base': 'Alumni ID must be a positive integer.',
    'number.positive': 'Alumni ID must be a positive integer.',
  }),
});

const listQuery = Joi.object({
  search: Joi.string().trim().max(150).allow(''),
  // A school's records can reach back decades; the ceiling only exists to keep a
  // typo out of the index.
  graduationYear: Joi.number().integer().min(1900).max(2200),
  stream: Joi.string().trim().max(30).allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Only the after-school fields. Name/email/phone live on the user record and are
// deliberately absent — see alumni.queries.js UPDATABLE.
const updateAlumniSchema = Joi.object({
  graduationYear: Joi.number().integer().min(1900).max(2200).allow(null),
  finalGrade: Joi.string().trim().max(20).allow('', null),
  currentInstitution: Joi.string().trim().max(255).allow('', null),
  currentProgram: Joi.string().trim().max(255).allow('', null),
  currentCompany: Joi.string().trim().max(255).allow('', null),
  currentDesignation: Joi.string().trim().max(255).allow('', null),
  linkedinUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow('', null).messages({
    'string.uri': 'The LinkedIn link must start with http:// or https://.',
  }),
  achievements: Joi.string().trim().max(5000).allow('', null),
  willingToMentor: Joi.boolean(),
  willingToRefer: Joi.boolean(),
  testimonial: Joi.string().trim().max(5000).allow('', null),
  testimonialApproved: Joi.boolean(),
}).min(1).messages({
  'object.min': 'Nothing to update.',
});

module.exports = { alumniIdParams, listQuery, updateAlumniSchema };
