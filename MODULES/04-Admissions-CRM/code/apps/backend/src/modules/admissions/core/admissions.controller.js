'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const service = require('./admissions.service');
const { COMMON_DOCUMENTS } = require('./admissions.validation');

const listDocuments = asyncHandler(async (req, res) => {
  const result = await service.listDocuments(req.user.org_id, req.params.leadId, await getActiveSchool(req));
  return success(res, { ...result, suggestions: COMMON_DOCUMENTS }, 'Checklist fetched');
});

const addDocument = asyncHandler(async (req, res) => {
  const document = await service.addDocument(
    req.user.org_id,
    req.params.leadId,
    req.body,
    req.user.user_id,
    await getActiveSchool(req)
  );
  await audit(req, 'ADMISSION_DOCUMENT_ADD', 'admission_document', document.id, {
    new_data: { leadId: Number(req.params.leadId), documentType: document.documentType },
  });
  return success(res, { document }, 'Document added to the checklist', 201);
});

const updateDocument = asyncHandler(async (req, res) => {
  const document = await service.updateDocument(
    req.user.org_id,
    req.params.documentId,
    req.body,
    req.user.user_id,
    await getActiveSchool(req)
  );
  const action = req.body.status === 'verified' ? 'ADMISSION_DOCUMENT_VERIFY' : 'ADMISSION_DOCUMENT_UPDATE';
  await audit(req, action, 'admission_document', document.id, { new_data: req.body });
  return success(res, { document }, 'Document updated');
});

const removeDocument = asyncHandler(async (req, res) => {
  const document = await service.removeDocument(req.user.org_id, req.params.documentId, await getActiveSchool(req));
  await audit(req, 'ADMISSION_DOCUMENT_REMOVE', 'admission_document', document.id, {
    old_data: { leadId: document.leadId, documentType: document.documentType },
  });
  return success(res, { removed: true }, 'Document removed from the checklist');
});

const listSeries = asyncHandler(async (req, res) => {
  const result = await service.listSeries(req.user.org_id);
  return success(res, result, 'Admission number series fetched');
});

const setPrefix = asyncHandler(async (req, res) => {
  const series = await service.setPrefix(req.user.org_id, req.body);
  await audit(req, 'ADMISSION_SERIES_UPDATE', 'admission_series', series.id, {
    new_data: { academicSession: series.academicSession, prefix: series.prefix },
  });
  return success(res, { series }, 'Number series saved');
});

module.exports = {
  listDocuments,
  addDocument,
  updateDocument,
  removeDocument,
  listSeries,
  setPrefix,
};
