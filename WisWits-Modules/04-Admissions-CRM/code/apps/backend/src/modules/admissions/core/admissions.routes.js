'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./admissions.controller');
const {
  leadIdParams,
  documentIdParams,
  createDocumentSchema,
  updateDocumentSchema,
  setPrefixSchema,
} = require('./admissions.validation');

const router = Router();

// Static segment first, so "/series" is never read as a ":leadId".
router.get('/series', requirePermission('admissions.view'), controller.listSeries);
router.put('/series', requirePermission('admissions.manage'), validate(setPrefixSchema), controller.setPrefix);

router.get(
  '/leads/:leadId/documents',
  requirePermission('admissions.view'),
  validate(leadIdParams, 'params'),
  controller.listDocuments
);

router.post(
  '/leads/:leadId/documents',
  requirePermission('admissions.manage'),
  validate(leadIdParams, 'params'),
  validate(createDocumentSchema),
  controller.addDocument
);

router.patch(
  '/documents/:documentId',
  requirePermission('admissions.manage'),
  validate(documentIdParams, 'params'),
  validate(updateDocumentSchema),
  controller.updateDocument
);

router.delete(
  '/documents/:documentId',
  requirePermission('admissions.manage'),
  validate(documentIdParams, 'params'),
  controller.removeDocument
);

module.exports = router;
