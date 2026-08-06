'use strict';
const Joi = require('joi');

// Where a paper is in its life. VARCHAR + this allowlist, never a MySQL ENUM.
const DOC_STATUSES = ['pending', 'received', 'verified', 'rejected'];

// What a school usually asks for. The UI offers these; the column takes any
// string, because one school's list is never another's.
const COMMON_DOCUMENTS = [
  { type: 'birth_certificate', name: 'Birth certificate' },
  { type: 'previous_marksheet', name: 'Previous marksheet' },
  { type: 'transfer_certificate', name: 'Transfer certificate' },
  { type: 'aadhaar', name: 'Aadhaar card' },
  { type: 'photograph', name: 'Passport photograph' },
  { type: 'address_proof', name: 'Address proof' },
  { type: 'caste_certificate', name: 'Caste certificate' },
  { type: 'medical_record', name: 'Medical record' },
];

const leadIdParams = Joi.object({
  leadId: Joi.number().integer().positive().required().messages({
    'number.base': 'Applicant ID must be a positive integer.',
    'number.positive': 'Applicant ID must be a positive integer.',
  }),
});

const documentIdParams = Joi.object({
  documentId: Joi.number().integer().positive().required().messages({
    'number.base': 'Document ID must be a positive integer.',
    'number.positive': 'Document ID must be a positive integer.',
  }),
});

const createDocumentSchema = Joi.object({
  documentType: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Choose which document this is.',
    'string.max': 'The document type cannot exceed 100 characters.',
  }),
  documentName: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Give the document a name.',
    'string.max': 'The document name cannot exceed 200 characters.',
  }),
  isRequired: Joi.boolean().default(true),
  status: Joi.string().valid(...DOC_STATUSES).default('pending'),
  remarks: Joi.string().trim().max(1000).allow('', null),
});

const updateDocumentSchema = Joi.object({
  documentName: Joi.string().trim().min(1).max(200),
  isRequired: Joi.boolean(),
  status: Joi.string().valid(...DOC_STATUSES),
  remarks: Joi.string().trim().max(1000).allow('', null),
}).min(1).messages({ 'object.min': 'Nothing to update.' });

const setPrefixSchema = Joi.object({
  academicSession: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Which session is this for?',
  }),
  // Kept to characters that survive being written on a form and typed back.
  prefix: Joi.string().trim().min(1).max(50).pattern(/^[A-Za-z0-9\-_.]+$/).required().messages({
    'string.pattern.base': 'The prefix can use letters, numbers, dashes, dots and underscores.',
    'string.empty': 'Give the series a prefix, such as ADM.',
  }),
});

module.exports = {
  DOC_STATUSES,
  COMMON_DOCUMENTS,
  leadIdParams,
  documentIdParams,
  createDocumentSchema,
  updateDocumentSchema,
  setPrefixSchema,
};
