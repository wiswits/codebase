'use strict';
const { AppError } = require('../_kit');
const docQueries = require('./documents.queries');
const seriesQueries = require('./series.queries');

// schoolId is the branch the request resolved to (null = not scoped). The
// checklist has no branch column; the applicant does, so every path here is
// gated on reaching the lead first.
async function requireLead(orgId, leadId, schoolId = null) {
  const lead = await docQueries.findLeadForOrg(orgId, leadId, schoolId);
  if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'That applicant was not found.');
  return lead;
}

async function listDocuments(orgId, leadId, schoolId = null) {
  const lead = await requireLead(orgId, leadId, schoolId);
  const documents = await docQueries.listForLead(orgId, leadId);

  // What the front office actually wants to know at a glance: is this file
  // complete enough to admit on.
  const required = documents.filter((d) => d.isRequired === 1);
  return {
    documents,
    summary: {
      total: documents.length,
      required: required.length,
      verified: documents.filter((d) => d.status === 'verified').length,
      requiredOutstanding: required.filter((d) => d.status !== 'verified').length,
      applicant: [lead.firstName, lead.lastName].filter(Boolean).join(' '),
    },
  };
}

async function addDocument(orgId, leadId, data, userId, schoolId = null) {
  await requireLead(orgId, leadId, schoolId);
  try {
    return await docQueries.createDocument(orgId, leadId, data, userId, schoolId);
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new AppError(
        409,
        'DOCUMENT_ALREADY_LISTED',
        'That document is already on this applicant\'s checklist.'
      );
    }
    throw err;
  }
}

async function updateDocument(orgId, documentId, data, userId, schoolId = null) {
  const existing = await docQueries.findById(orgId, documentId, schoolId);
  if (!existing) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'That document was not found.');
  const updated = await docQueries.updateDocument(orgId, documentId, data, userId, schoolId);
  if (!updated) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'That document was not found.');
  return updated;
}

async function removeDocument(orgId, documentId, schoolId = null) {
  const existing = await docQueries.findById(orgId, documentId, schoolId);
  if (!existing) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'That document was not found.');
  await docQueries.deleteDocument(orgId, documentId, schoolId);
  return existing;
}

async function listSeries(orgId) {
  return { series: await seriesQueries.listSeries(orgId) };
}

async function setPrefix(orgId, { academicSession, prefix }) {
  const row = await seriesQueries.setPrefix(orgId, academicSession, prefix);
  if (!row) throw new AppError(500, 'SERIES_WRITE_FAILED', 'Could not save the number series.');
  return row;
}

module.exports = {
  requireLead,
  listDocuments,
  addDocument,
  updateDocument,
  removeDocument,
  listSeries,
  setPrefix,
};
